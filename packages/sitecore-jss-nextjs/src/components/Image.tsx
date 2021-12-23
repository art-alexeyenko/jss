import { mediaApi } from '@sitecore-jss/sitecore-jss/media';
import PropTypes from 'prop-types';
import React from 'react';
import { getEEMarkup } from '@sitecore-jss/sitecore-jss-react';
import {
  default as NextImage,
  ImageLoader,
  ImageLoaderProps,
  ImageProps as NextImageProps,
} from 'next/image';
// import { getPublicUrl } from '../utils';
export interface ImageFieldValue {
  [attributeName: string]: unknown;
  src?: string;
  /** HTML attributes that will be appended to the rendered <img /> tag. */
}

export interface ImageField {
  value?: ImageFieldValue;
  editable?: string;
}

export interface ImageSizeParameters {
  [attr: string]: string | number | undefined;
  /** Fixed width of the image */
  w?: number;
  /** Fixed height of the image */
  h?: number;
  /** Max width of the image */
  mw?: number;
  /** Max height of the image */
  mh?: number;
  /** Ignore aspect ratio */
  iar?: 1 | 0;
  /** Allow stretch */
  as?: 1 | 0;
  /** Image scale. Defaults to 1.0 */
  sc?: number;
}

export interface ImageProps extends NextImageProps {
  [attributeName: string]: unknown;
  /** Image field data (consistent with other field types) */
  field?: ImageField | ImageFieldValue;

  /**
   * Can be used to explicitly disable inline editing.
   * If true and `media.editable` has a value, then `media.editable` will be processed
   * and rendered as component output. If false, `media.editable` value will be ignored and not rendered.
   */
  editable?: boolean;

  /**
   * Parameters that will be attached to Sitecore media URLs
   */
  imageParams?: {
    [paramName: string]: string | number;
  };
  /**
   * Custom regexp that finds media URL prefix that will be replaced by `/-/jssmedia` or `/~/jssmedia`.
   * @example
   * /\/([-~]{1})assets\//i
   * /-assets/website -> /-/jssmedia/website
   * /~assets/website -> /~/jssmedia/website
   */
  mediaUrlPrefix?: RegExp;

  /** HTML attributes that will be appended to the rendered <img /> tag. */
}

// TODO: Finalize loader for XM - export it? we need imageParams but also would
// like the decouple this function.
// TODO: unit tests fo xmLoader and this component :)
export const xmLoader: ImageLoader = ({ src, width }: ImageLoaderProps): string => {
  const url = new URL(`https://cm.jss.localhost${src}`);
  const params = url.searchParams;
  params.set('mw', params.get('mw') || width.toString());
  params.delete('w');

  // TODO:
  // hardcoded hostname at the moment to get around a  bug.
  // image loaders inside Next's repo like Cloudinary
  // have access to a root prop? or env variable. We want to access root also if we need to inject the hostname.
  return url.href;
};

export const Image: React.SFC<ImageProps> = ({
  editable,
  imageParams,
  field,
  mediaUrlPrefix,
  ...otherProps
}) => {
  // next handles srcSet, throw error if srcSet is present
  if (otherProps.srcSet) {
    throw new Error(
      'srcSet not supported on Nextjs Image component. Use deviceSizes in nextjs.config: https://nextjs.org/docs/api-reference/next/image#device-sizes'
    );
  }

  // next handles src and we use a custom loader,
  // throw error if these are present
  if (otherProps.src || otherProps.loader) {
    // TODO: Refine error message
    throw new Error(
      'Detected conflicting props src or loader. If you wish to use these props, use next/image directly.'
    );
  }

  const dynamicMedia = field as ImageField | ImageFieldValue;

  if (
    !field ||
    (!dynamicMedia.editable && !dynamicMedia.value && !(dynamicMedia as ImageFieldValue).src)
  ) {
    return null;
  }

  const imageField = dynamicMedia as ImageField;

  // TODO: break this out into function getEEMarkup or something
  // we likely have an experience editor value, should be a string
  if (editable && imageField.editable) {
    return getEEMarkup(imageField, imageParams, mediaUrlPrefix, otherProps);
  }

  // some wise-guy/gal is passing in a 'raw' image object value
  const img = (dynamicMedia as ImageFieldValue).src
    ? field
    : (dynamicMedia.value as ImageFieldValue);
  if (!img) {
    return null;
  }
  // this prop is needed for non-static images - set it to 1x1 transparent pixel base64 encoded if not supplied by user.
  if (!otherProps.blurDataURL) {
    otherProps.blurDataURL =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
  const attrs = { ...img, ...otherProps };
  attrs.src = mediaApi.updateImageUrl(attrs.src, imageParams, mediaUrlPrefix);

  if (attrs) {
    // TODO?: Create a loader for edge - we probably don't need to do this as
    // edge is modeled on XM.
    // TODO: export - do we need to do anything special for it? (we don't think so)

    return <NextImage loader={xmLoader} {...attrs} />;
  }

  return null; // we can't handle the truth
};

Image.propTypes = {
  field: PropTypes.oneOfType([
    PropTypes.shape({
      src: PropTypes.string.isRequired,
    }),
    PropTypes.shape({
      value: PropTypes.object,
      editable: PropTypes.string,
    }),
  ]),
  editable: PropTypes.bool,
  mediaUrlPrefix: PropTypes.instanceOf(RegExp),
  imageParams: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.number.isRequired, PropTypes.string.isRequired]).isRequired
  ),
};

Image.defaultProps = {
  editable: true,
};

Image.displayName = 'Image';
