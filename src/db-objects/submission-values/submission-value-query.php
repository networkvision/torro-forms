<?php
/**
 * Submission value query class
 *
 * @package TorroForms
 * @since 1.0.0
 */

namespace awsmug\Torro_Forms\DB_Objects\Submission_Values;

use Leaves_And_Love\Plugin_Lib\DB_Objects\Query;

/**
 * Class representing a query for submission values.
 *
 * @since 1.0.0
 */
class Submission_Value_Query extends Query {
	/**
	 * Constructor.
	 *
	 * Sets the manager instance and assigns the defaults.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param Leaves_And_Love\Plugin_Lib\DB_Objects\Manager $manager The manager instance for the model query.
	 */
	public function __construct( $manager ) {
		parent::__construct( $manager );

		$this->query_var_defaults['submission_id'] = '';
		$this->query_var_defaults['element_id']    = '';
	}

	/**
	 * Parses the SQL where clause.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return array Array with the first element being the array of SQL where clauses and the second
	 *               being the array of arguments for those where clauses.
	 */
	protected function parse_where() {
		list( $where, $args ) = parent::parse_where();

		list( $where, $args ) = $this->parse_default_where_field( $where, $args, 'submission_id', 'submission_id', '%d', 'absint', true );
		list( $where, $args ) = $this->parse_default_where_field( $where, $args, 'element_id', 'element_id', '%d', 'absint', true );

		return array( $where, $args );
	}
}