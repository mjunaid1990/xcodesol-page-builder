<?php
/** Safely allow simple SVG icons in the WordPress media library. */
defined( 'ABSPATH' ) || exit;

final class XCOPB_SVG_Upload {
	/** Register narrowly scoped SVG upload filters. */
	public static function init() {
		add_filter( 'upload_mimes', array( __CLASS__, 'allow_svg_mime' ) );
		add_filter( 'wp_handle_upload_prefilter', array( __CLASS__, 'sanitize_svg_upload' ) );
		add_filter( 'wp_check_filetype_and_ext', array( __CLASS__, 'recognize_svg' ), 10, 4 );
	}

	/** Permit SVG only to users who can upload media. */
	public static function allow_svg_mime( $mimes ) {
		if ( current_user_can( 'upload_files' ) ) {
			$mimes['svg'] = 'image/svg+xml';
		}
		return $mimes;
	}

	/** Strip scripts, styles, external references, and unsupported SVG features before saving. */
	public static function sanitize_svg_upload( $file ) {
		if ( empty( $file['name'] ) || 'svg' !== strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) ) ) {
			return $file;
		}
		if ( ! current_user_can( 'upload_files' ) || empty( $file['tmp_name'] ) || ! is_readable( $file['tmp_name'] ) ) {
			$file['error'] = __( 'You are not allowed to upload SVG files.', 'xcodesol-page-builder' );
			return $file;
		}
		if ( ! empty( $file['size'] ) && $file['size'] > 1048576 ) {
			$file['error'] = __( 'SVG icons must be smaller than 1 MB.', 'xcodesol-page-builder' );
			return $file;
		}

		$contents = file_get_contents( $file['tmp_name'] );
		if ( ! is_string( $contents ) || false === stripos( $contents, '<svg' ) ) {
			$file['error'] = __( 'This file does not contain a valid SVG icon.', 'xcodesol-page-builder' );
			return $file;
		}

		$allowed = array(
			'svg' => array( 'xmlns' => true, 'viewbox' => true, 'width' => true, 'height' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true, 'role' => true, 'aria-hidden' => true ),
			'g' => array( 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true, 'opacity' => true, 'transform' => true ),
			'path' => array( 'd' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true, 'fill-rule' => true, 'clip-rule' => true, 'opacity' => true, 'transform' => true ),
			'circle' => array( 'cx' => true, 'cy' => true, 'r' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'opacity' => true ),
			'ellipse' => array( 'cx' => true, 'cy' => true, 'rx' => true, 'ry' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ),
			'rect' => array( 'x' => true, 'y' => true, 'width' => true, 'height' => true, 'rx' => true, 'ry' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true, 'opacity' => true ),
			'line' => array( 'x1' => true, 'y1' => true, 'x2' => true, 'y2' => true, 'stroke' => true, 'stroke-width' => true ),
			'polyline' => array( 'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ),
			'polygon' => array( 'points' => true, 'fill' => true, 'stroke' => true, 'stroke-width' => true ),
		);
		$clean = wp_kses( $contents, $allowed );
		if ( false === stripos( $clean, '<svg' ) || false === file_put_contents( $file['tmp_name'], $clean ) ) {
			$file['error'] = __( 'The SVG could not be safely sanitized. Use a simple icon SVG and try again.', 'xcodesol-page-builder' );
		}
		return $file;
	}

	/** Correct WordPress MIME sniffing for the already sanitized SVG file. */
	public static function recognize_svg( $data, $file, $filename, $mimes ) {
		if ( current_user_can( 'upload_files' ) && 'svg' === strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) ) && is_readable( $file ) ) {
			$contents = file_get_contents( $file );
			if ( is_string( $contents ) && false !== stripos( $contents, '<svg' ) ) {
				$data['ext'] = 'svg';
				$data['type'] = 'image/svg+xml';
				$data['proper_filename'] = false;
			}
		}
		return $data;
	}
}
