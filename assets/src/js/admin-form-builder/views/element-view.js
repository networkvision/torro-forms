( function( torro, $, _, fieldsAPI, dummyFieldManager ) {
	'use strict';

	function parseFields( fields, element ) {
		var parsedFields = [];
		var hasLabel = false;

		_.each( fields, function( field ) {
			var parsedField;
			var elementChoices;
			var elementSetting;

			if ( _.isUndefined( field.type ) || _.isUndefined( dummyFieldManager.fields[ 'dummy_' + field.type ] ) ) {
				return;
			}

			parsedField = _.clone( dummyFieldManager.fields[ 'dummy_' + field.type ] );

			parsedField.section     = field.section;
			parsedField.label       = field.label;
			parsedField.description = field.description;
			parsedField['default']  = field['default'] || null;

			if ( field.is_choices ) {
				elementChoices = element.element_choices.where({
					field: _.isString( field.is_choices ) ? field.is_choices : '_main'
				});

				// TODO: Set ID and name for the repeatable choices field.
				return;
			}

			if ( field.is_label ) {

				// Only one label field is allowed.
				if ( hasLabel ) {
					return;
				}

				hasLabel = true;

				parsedField.id = 'torro_element_' + element.get( 'id' ) + '_label';
				parsedField.name = torro.getFieldName( element, 'label' );
				parsedField.currentValue = element.get( 'label' );
			} else {
				if ( field.repeatable ) {

					// Repeatable fields are currently not supported.
					return;
				}

				elementSetting = element.element_settings.findWhere({
					name: field.slug
				});

				if ( ! elementSetting ) {
					return;
				}

				parsedField.id = 'torro_element_' + element.get( 'id' ) + '_' + elementSetting.get( 'id' );
				parsedField.name = torro.getFieldName( elementSetting, 'value' );
				parsedField.currentValue = elementSetting.get( 'value' );
			}

			if ( parsedField.inputAttrs ) {
				parsedField.inputAttrs.id = parsedField.id;
				parsedField.inputAttrs.name = parsedField.name;

				if ( _.isArray( field.input_classes ) ) {
					parsedField.inputAttrs['class'] += ' ' + field.input_classes.join( ' ' );
				}

				if ( parsedField.description.length ) {
					parsedField.inputAttrs['aria-describedby'] = parsedField.id + '-description';
				}
			}

			if ( parsedField.labelAttrs ) {
				parsedField.labelAttrs.id = parsedField.id + '-label';
				parsedField.labelAttrs['for'] = parsedField.id;
			}

			if ( parsedField.wrapAttrs ) {
				parsedField.wrapAttrs.id = parsedField.id + '-wrap';
			}

			parsedFields.push( parsedField );
		});

		return parsedFields;
	}

	/**
	 * An element view.
	 *
	 * @class
	 *
	 * @param {torro.Builder.Element} element Element model.
	 * @param {object}                options View options.
	 */
	function ElementView( element, options ) {
		var id = element.get( 'id' );

		this.element = element;
		this.options = options || {};

		this.wrapTemplate = torro.template( 'element' );
		this.sectionTabTemplate = torro.template( 'element-section-tab' );
		this.sectionPanelTemplate = torro.template( 'element-section-panel' );
		this.fieldTemplate = torro.template( 'element-field' );

		this.$wrap = $( '<div />' );
		this.$wrap.attr( 'id', 'torro-element-' + id );
		this.$wrap.addClass( 'torro-element' );
	}

	_.extend( ElementView.prototype, {
		render: function() {
			var templateData            = this.element.attributes;
			templateData.type           = this.element.element_type.attributes;
			templateData.active         = this.element.collection.props.get( 'active' ).includes( this.element.get( 'id' ) );
			templateData.active_section = this.element.getActiveSection();

			this.$wrap.html( this.wrapTemplate( templateData ) );

			this.attach();

			this.initializeSections();
			this.initializeFields();
		},

		destroy: function() {
			this.deinitializeFields();
			this.deinitializeSections();

			this.detach();

			this.$wrap.remove();
		},

		initializeSections: function() {
			var $sectionTabsWrap   = this.$wrap.find( '.torro-element-content-tabs' );
			var $sectionPanelsWrap = this.$wrap.find( '.torro-element-content-panels' );

			var sections = this.element.element_type.getSections();
			var element = this.element;

			_.each( sections, _.bind( function( section ) {
				var templateData = _.clone( section );

				templateData.elementId = element.get( 'id' );
				templateData.active = element.getActiveSection() === templateData.slug;

				$sectionTabsWrap.append( this.sectionTabTemplate( templateData ) );
				$sectionPanelsWrap.append( this.sectionPanelTemplate( templateData ) );
			}, this ) );
		},

		deinitializeSections: function() {
			var $sectionTabsWrap   = this.$wrap.find( '.torro-element-content-tabs' );
			var $sectionPanelsWrap = this.$wrap.find( '.torro-element-content-panels' );

			$sectionTabsWrap.empty();
			$sectionPanelsWrap.empty();
		},

		initializeFields: function() {
			var fields = this.element.element_type.getFields();

			this.fieldManager = new fieldsAPI.FieldManager( parseFields( fields, this.element ), {
				instanceId: 'torro_element_' + this.element.get( 'id' )
			});
			this.fieldViews = [];

			_.each( this.fieldManager.models, _.bind( function( field ) {
				var viewClassName      = field.get( 'backboneView' );
				var FieldView          = fieldsAPI.FieldView;
				var $sectionFieldsWrap = this.$wrap.find( '#element-panel-' + this.element.get( 'id' ) + '-' + field.get( 'section' ) + ' > .torro-element-fields' );
				var view;

				if ( ! $sectionFieldsWrap.length ) {
					return;
				}

				$sectionFieldsWrap.append( this.fieldTemplate( field.attributes ) );

				if ( viewClassName && 'FieldView' !== viewClassName && fieldsAPI.FieldView[ viewClassName ] ) {
					FieldView = fieldsAPI.FieldView[ viewClassName ];
				}

				view = new FieldView({
					model: field
				});

				view.renderLabel();
				view.renderContent();

				this.fieldViews.push( view );
			}, this ) );
		},

		deinitializeFields: function() {
			_.each( this.fieldViews, function( fieldView ) {
				fieldView.remove();
			});

			this.$wrap.find( '.torro-element-fields' ).each( function() {
				$( this ).empty();
			});

			this.fieldViews = [];
			this.fieldManager = null;
		},

		attach: function() {
			this.element.on( 'remove', this.listenRemove, this );
			this.element.on( 'change:label', this.listenChangeLabel, this );
			this.element.on( 'change:type', this.listenChangeType, this );
			this.element.on( 'change:sort', this.listenChangeSort, this );
			this.element.on( 'changeElementType', this.listenChangeElementType, this );
			this.element.on( 'changeActiveSection', this.listenChangeActiveSection, this );
			this.element.collection.props.on( 'toggleActive', this.listenChangeActive, this );

			this.$wrap.on( 'click', '.torro-element-expand-button', _.bind( this.toggleActive, this ) );
			this.$wrap.on( 'click', '.delete-element-button', _.bind( this.deleteElement, this ) );
			this.$wrap.on( 'click', '.torro-element-content-tab', _.bind( this.changeActiveSection, this ) );

			// TODO: add jQuery hooks
		},

		detach: function() {
			this.element.collection.props.off( 'toggleActive', this.listenChangeActive, this );
			this.element.off( 'changeActiveSection', this.listenChangeActiveSection, this );
			this.element.off( 'changeElementType', this.listenChangeElementType, this );
			this.element.off( 'change:sort', this.listenChangeSort, this );
			this.element.off( 'change:type', this.listenChangeType, this );
			this.element.off( 'change:label', this.listenChangeLabel, this );
			this.element.off( 'remove', this.listenRemove, this );

			this.$wrap.off( 'click', '.torro-element-content-tab', _.bind( this.changeActiveSection, this ) );
			this.$wrap.off( 'click', '.delete-element-button', _.bind( this.deleteElement, this ) );
			this.$wrap.off( 'click', '.torro-element-expand-button', _.bind( this.toggleActive, this ) );

			// TODO: remove jQuery hooks
		},

		listenRemove: function() {
			var id = this.element.get( 'id' );

			if ( ! torro.isTempId( id ) ) {
				$( '#torro-deleted-wrap' ).append( '<input type="hidden" name="' + torro.getDeletedFieldName( this.element ) + '" value="' + id + '" />' );
			}

			this.destroy();
		},

		listenChangeLabel: function( element, label ) {
			var name = torro.escapeSelector( torro.getFieldName( this.element, 'label' ) );

			this.$wrap.find( 'input[name="' + name + '"]' ).val( label );
		},

		listenChangeType: function( element, type ) {
			var name = torro.escapeSelector( torro.getFieldName( this.element, 'type' ) );

			this.$wrap.find( 'input[name="' + name + '"]' ).val( type );
		},

		listenChangeSort: function( element, sort ) {
			var name = torro.escapeSelector( torro.getFieldName( this.element, 'sort' ) );

			this.$wrap.find( 'input[name="' + name + '"]' ).val( sort );
		},

		listenChangeElementType: function() {
			this.deinitializeFields();
			this.deinitializeSections();

			this.initializeSections();
			this.initializeFields();
		},

		listenChangeActiveSection: function( element, activeSection ) {
			var $button = this.$wrap.find( '.torro-element-content-tab[data-slug="' + activeSection + '"]' );

			this.$wrap.find( '.torro-element-content-tab' ).attr( 'aria-selected', 'false' );
			this.$wrap.find( '.torro-element-content-panel' ).attr( 'aria-hidden', 'true' );

			if ( $button.length ) {
				$button.attr( 'aria-selected', 'true' );
				this.$wrap.find( '#' + $button.attr( 'aria-controls' ) ).attr( 'aria-hidden', 'false' );
			}
		},

		listenChangeActive: function( props, active ) {
			if ( active.includes( this.element.get( 'id' ) ) ) {
				this.$wrap.find( '.torro-element-expand-button' ).attr( 'aria-expanded', 'true' ).find( '.screen-reader-text' ).text( this.options.i18n.hideContent );
				this.$wrap.find( '.torro-element-content' ).addClass( 'is-expanded' );
			} else {
				this.$wrap.find( '.torro-element-expand-button' ).attr( 'aria-expanded', 'false' ).find( '.screen-reader-text' ).text( this.options.i18n.showContent );
				this.$wrap.find( '.torro-element-content' ).removeClass( 'is-expanded' );
			}
		},

		toggleActive: function() {
			this.element.collection.toggleActive( this.element.get( 'id' ) );
		},

		deleteElement: function() {
			torro.askConfirmation( this.options.i18n.confirmDeleteElement, _.bind( function() {
				this.element.collection.remove( this.element );
			}, this ) );
		},

		changeActiveSection: function( e ) {
			var $button = $( e.target || e.delegateTarget );

			this.element.setActiveSection( $button.data( 'slug' ) );
		}
	});

	torro.Builder.ElementView = ElementView;

})( window.torro, window.jQuery, window._, window.pluginLibFieldsAPI, window.pluginLibFieldsAPIData.field_managers.torro_dummy_1 );
