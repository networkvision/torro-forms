<?php
/**
 * API-API Request_Transport_Exception class
 *
 * @package APIAPI\Core\Exception
 * @since 1.0.0
 */

namespace APIAPI\Core\Exception;

use APIAPI\Core\Exception;

if ( ! class_exists( 'APIAPI\Core\Exception\Request_Transport_Exception' ) ) {

	/**
	 * Request_Transport_Exception class.
	 *
	 * Thrown when a request cannot be sent.
	 *
	 * @since 1.0.0
	 */
	class Request_Transport_Exception extends Exception {

	}

}
