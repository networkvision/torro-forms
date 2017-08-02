<?php
/**
 * Form list page handler class
 *
 * @package TorroForms
 * @since 1.0.0
 */

namespace awsmug\Torro_Forms\DB_Objects\Forms;

use WP_Post;
use WP_Error;

/**
 * Class for handling form list page behavior.
 *
 * @since 1.0.0
 */
class Form_List_Page_Handler {

	/**
	 * Form manager instance.
	 *
	 * @since 1.0.0
	 * @access protected
	 * @var Form_Manager
	 */
	protected $form_manager;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param Form_Manager $form_manager Form manager instance.
	 */
	public function __construct( $form_manager ) {
		$this->form_manager = $form_manager;
	}

	/**
	 * Adjusts the list table columns if conditions are met.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array $columns Form list table columns.
	 * @return array Adjust columns.
	 */
	public function maybe_adjust_table_columns( $columns ) {
		$new_columns = array(
			'form_shortcode' => __( 'Shortcode', 'torro-forms' ),
		);

		return array_merge( array_slice( $columns, 0, 2, true ), $new_columns, array_slice( $columns, 2, count( $columns ) - 1, true ) );
	}

	/**
	 * Renders a custom list table column if conditions are met.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $column_name Name of the column to render.
	 * @param int    $post_id     Current post ID.
	 */
	public function maybe_render_custom_table_column( $column_name, $post_id ) {
		$form = $this->form_manager->get( $post_id );
		if ( ! $form ) {
			return;
		}

		$this->render_custom_list_table_column( $column_name, $form );
	}

	/**
	 * Renders a custom list table column.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @param string $column_name Name of the column to render.
	 * @param Form   $form        Current form object.
	 */
	protected function render_custom_list_table_column( $column_name, $form ) {
		switch ( $column_name ) {
			case 'form_shortcode':
				echo '<code>' . sprintf( "[{$this->form_manager->get_prefix()}form id=&quot;%d&quot;]", $form->id ) . '</code>';
				break;
		}
	}
}