import { useEffect } from 'react';
<% if (prerender === 'SSG') { -%>
import { GetStaticPaths, GetStaticProps } from 'next';
<% } else if (prerender === 'SSR') { -%>
import { GetServerSideProps } from 'next';
<% } -%>
import NotFound from 'src/NotFound';
import Layout from 'src/Layout';
import {
  SitecoreContext,
  ComponentPropsContext,
  handleEditorFastRefresh,
  <% if (prerender === 'SSG') { -%>
  StaticPath,
  <% } -%>
} from '@sitecore-jss/sitecore-jss-nextjs';
import { SitecorePageProps } from 'lib/page-props';
import { sitecorePagePropsFactory } from 'lib/page-props-factory';
// different componentFactory method will be used based on whether page is being edited
import { componentFactory, editingComponentFactory } from 'temp/componentFactory';
<% if (prerender === 'SSG') { -%>
import { sitemapFetcher } from 'lib/sitemap-fetcher';

<% } -%>

const SitecorePage = ({ notFound, componentProps, layoutData }: SitecorePageProps): JSX.Element => {
  useEffect(() => {
    // Since Sitecore editors do not support Fast Refresh, need to refresh EE chromes after Fast Refresh finished
    handleEditorFastRefresh();
  }, []);

  if (notFound || !layoutData.sitecore.route) {
    // Shouldn't hit this (as long as 'notFound' is being returned below), but just to be safe
    return <NotFound />;
  }

  const isEditing = layoutData.sitecore.context.pageEditing;

  return (
    <ComponentPropsContext value={componentProps}>
      <SitecoreContext
        componentFactory={isEditing ? editingComponentFactory : componentFactory}
        layoutData={layoutData}
      >
        <Layout layoutData={layoutData} />
      </SitecoreContext>
    </ComponentPropsContext>
  );
};

<% if (prerender === 'SSG') { -%>
// This function gets called at build and export time to determine
// pages for SSG ("paths", as tokenized array).
export const getStaticPaths: GetStaticPaths = async (context) => {
  // Fallback, along with revalidate in getStaticProps (below),
  // enables Incremental Static Regeneration. This allows us to
  // leave certain (or all) paths empty if desired and static pages
  // will be generated on request (development mode in this example).
  // Alternatively, the entire sitemap could be pre-rendered
  // ahead of time (non-development mode in this example).
  // See https://nextjs.org/docs/basic-features/data-fetching#incremental-static-regeneration

  let paths: StaticPath[] = [];
  let fallback: boolean | 'blocking' = 'blocking';

  if (process.env.NODE_ENV !== 'development') {
    try {
      // Note: Next.js runs export in production mode
      paths = await sitemapFetcher.fetch(context);
    } catch (error) {
      console.log('Error occurred while fetching static paths');
      console.log(error);
    }

    fallback = process.env.EXPORT_MODE ? false : fallback;
  }

  return {
    paths,
    fallback,
  };
};

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation (or fallback) is enabled and a new request comes in.
export const getStaticProps: GetStaticProps = async (context) => {
<% } else if (prerender === 'SSR') { -%>
// This function gets called at request time on server-side.
export const getServerSideProps: GetServerSideProps = async (context) => {
<% } -%>
  const props = await sitecorePagePropsFactory.create(context);

  return {
    props,
<% if (prerender === 'SSG') { -%>
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 5 seconds
    revalidate: 5, // In seconds
<% } -%>
    notFound: props.notFound, // Returns custom 404 page with a status code of 404 when true
  };
};

export default SitecorePage;
