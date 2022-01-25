import { mediaApi } from '@sitecore-jss/sitecore-jss/media';
import PropTypes from 'prop-types';
import React from 'react';
import {
  getEEMarkup,
  ImageProps,
  ImageField,
  ImageFieldValue,
} from '@sitecore-jss/sitecore-jss-react';
import Image, {
  ImageLoader,
  ImageLoaderProps,
  ImageProps as NextImageProperties,
} from 'next/image';

type NextImageProps = Pick<
  ImageProps,
  'editable' | 'imageParams' | 'field' | 'mediaUrlPrefix' | 'srcSet'
> &
  Partial<NextImageProperties>;

export type ImageConfigComplete = {
  path: string;
};

export type ImageConfig = Partial<ImageConfigComplete>;

const { path: configPath } = (process.env.__NEXT_IMAGE_OPTS as any) as ImageConfigComplete;

export const loader: ImageLoader = ({ src, width }: ImageLoaderProps): string => {
  try {
    const url = new URL(`${configPath}${src}`);
    const params = url.searchParams;
    params.set('mw', params.get('mw') || width.toString());
    params.delete('w');

    return url.href;
  } catch (err) {
    throw new Error(
      'Failed to load image. Please make sure configPath is configured correctly in next.config.js'
    );
  }
};

export const NextImage: React.SFC<NextImageProps> = ({
  editable,
  imageParams,
  field,
  mediaUrlPrefix,
  ...otherProps
}) => {
  // next handles src and we use a custom loader,
  // throw error if these are present
  if (otherProps.src || otherProps.loader) {
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

  // we likely have an experience editor value, should be a string
  if (editable && imageField.editable) {
    return getEEMarkup(imageField, imageParams, mediaUrlPrefix, otherProps as { src: string });
  }

  // some wise-guy/gal is passing in a 'raw' image object value
  const img: ImageFieldValue = (dynamicMedia as ImageFieldValue).src
    ? (field as ImageFieldValue)
    : (dynamicMedia.value as ImageFieldValue);
  if (!img) {
    return null;
  }
  // this prop is needed for non-static images - set it to 1x1 transparent pixel base64 encoded if not supplied by user.
  if (!otherProps.blurDataURL) {
    otherProps.blurDataURL =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }

  const attrs = {
    ...img,
    ...otherProps,
    src: mediaApi.updateImageUrl(img.src as string, imageParams, mediaUrlPrefix),
  };

  if (attrs) {
    return <Image loader={loader} {...attrs} />;
  }

  return null; // we can't handle the truth
};

NextImage.propTypes = {
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

NextImage.defaultProps = {
  editable: true,
};

NextImage.displayName = 'NextImage';
