<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_ai_content\form;

use HTML_QuickForm_element;
use templatable;
use core\output\renderer_base;
use core\output\mustache_template_finder;
use function s;
use local_ai_content\persistent\contentconfig;

defined('MOODLE_INTERNAL') || die();

/**
 * RAG Contexts form element
 *
 * Displays a list of course activities with contentconfig records,
 * grouped by section with nested subsections. Each group has a
 * "Select all/none" checkbox, and individual activity checkboxes.
 *
 * @package   local_ai_content
 * @category  form
 * @copyright 2026 Michael Hughes
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ragcontexts extends HTML_QuickForm_element implements templatable {

    /** @var string HTML for help button */
    var $_helpbutton = '';

    /** @var bool If true label will be hidden */
    var $_hiddenLabel = false;

    /** @var string Form element type */
    var $_elementTemplateType = 'default';

    /** @var int Course ID */
    private $courseid;

    /** @var array Selected activity CMIDs */
    private $selected = [];

    /** @var array Sections data */
    private $sections = [];

    /** @var bool Whether to show empty sections */
    private $showemptysections = false;

    /** @var string an element template for groups */
    public $_groupElementTemplate;

    /**
     * Constructor
     *
     * @param string $elementName Name of the form element
     * @param mixed $elementLabel Label(s) for the element
     * @param array $options Options for the element (e.g., 'course' => courseid)
     * @param mixed $attributes Either HTML attribute string or associative array
     */
    public function __construct($elementName = null, $elementLabel = null, $options = null, $attributes = null) {
        parent::__construct($elementName, $elementLabel, $attributes);

        $this->_type = 'ragcontexts';

        // Set course ID from options
        if (isset($options['course'])) {
            $this->courseid = $options['course'];
        }

        // Set selected values if provided
        if (isset($options['selected'])) {
            $this->selected = (array) $options['selected'];
        }

        // Set whether to show empty sections from options or plugin setting
        if (isset($options['showemptysections'])) {
            $this->showemptysections = (bool) $options['showemptysections'];
        } else {
            // Use the global plugin setting
            $this->showemptysections = get_config('local_ai_content', 'showemptysections') ? true : false;
        }
    }

    /**
     * Set whether to show empty sections
     *
     * @param bool $show Whether to show empty sections
     * @return self
     */
    public function setShowEmptySections($show) {
        $this->showemptysections = (bool) $show;
        return $this;
    }

    /**
     * Set the course ID
     *
     * @param int $courseid Course ID
     * @return self
     */
    public function setCourse($courseid) {
        $this->courseid = $courseid;
        return $this;
    }

    /**
     * Set the selected activities
     *
     * @param array $selected Array of selected CMIDs
     * @return self
     */
    public function setSelected($selected) {
        $this->selected = (array) $selected;
        return $this;
    }

    /**
     * Get the selected activities
     *
     * @return array Array of selected CMIDs
     */
    public function getSelected() {
        return $this->selected;
    }

    /**
     * Called by HTML_QuickForm whenever form event is made on this element
     *
     * @param string $event Name of event
     * @param mixed $arg event arguments
     * @param object $caller calling object
     * @return bool
     */
    public function onQuickFormEvent($event, $arg, &$caller) {
        switch ($event) {
            case 'updateValue':
                $value = $this->_findValue($caller->_constantValues);
                if (null === $value) {
                    $value = $this->_findValue($caller->_submitValues);
                    if (null === $value && (!$caller->isSubmitted())) {
                        $value = $this->_findValue($caller->_defaultValues);
                    }
                }
                if (null !== $value) {
                    $this->setValue($value);
                }
                break;
        }
        return parent::onQuickFormEvent($event, $arg, $caller);
    }

    /**
     * Sets the default values of the select box
     *
     * @param mixed $values Array or comma delimited string of selected values
     * @return void
     */
    public function setSelectedValues($values) {
        if (is_string($values)) {
            $values = explode(',', $values);
        }
        if (is_array($values)) {
            $this->selected = array_values($values);
        }
    }

    /**
     * Get the value of the element
     *
     * @return array Array of selected CMIDs
     */
    public function getValue() {
        return $this->selected;
    }

    /**
     * Set the value of the element
     *
     * @param mixed $value Array or comma delimited string of selected values
     * @return void
     */
    public function setValue($value) {
        $this->setSelectedValues($value);
    }

    /**
     * Build the sections data structure
     *
     * @return array
     */
    private function buildSectionsData() {
        global $DB;

        $sections = [];

        if (empty($this->courseid)) {
            debugging('ragcontexts: courseid is empty or not set', DEBUG_DEVELOPER);
            return $sections;
        }

        // Get the course
        $course = get_course($this->courseid);
        if (!$course) {
            return $sections;
        }

        // Get modinfo for the course
        $modinfo = get_fast_modinfo($course);

        // Get contentconfig records for this course using the persistent class
        $contentconfigs = [];
        $configs = contentconfig::get_course_module_configs($course);
        if (!empty($configs)) {
            foreach ($configs as $config) {
                $contentconfigs[$config->cmid] = $config;
            }
        }

        // Get all sections for the course
        $sectioninfos = $modinfo->get_section_info_all();

        // Build sections with their activities
        foreach ($sectioninfos as $sectionnum => $sectioninfo) {
            if (empty($sectioninfo->sequence)) {
                continue;
            }

            $cmidsinsection = explode(',', $sectioninfo->sequence);

            // Check if this is a delegated section (subsection)
            if ($sectioninfo->is_delegated()) {
                continue;
            }

            $sectiondata = [
                'id' => $sectioninfo->id,
                'section' => $sectionnum,
                'name' => !empty($sectioninfo->name) ? format_string($sectioninfo->name) : get_string('section', 'local_ai_content', $sectionnum),
                'activities' => [],
                'subsections' => [],
            ];

            // Get activities in this section
            foreach ($cmidsinsection as $cmid) {
                $cm = $modinfo->get_cm($cmid);

                // Skip hidden activities or those not visible to user
                if (!$cm->uservisible) {
                    continue;
                }

                $config = isset($contentconfigs[$cmid]) ? $contentconfigs[$cmid] : null;

                // Only include activities that have a contentconfig record with allowindex = 1
                if (empty($config) || empty($config->allowindex)) {
                    continue;
                }

                $sectiondata['activities'][] = [
                    'cmid' => $cmid,
                    'name' => format_string($cm->name),
                    'checked' => !empty($config->allowindex),
                    'sectionid' => $sectioninfo->id,
                    'subsectionid' => null,
                ];
            }

            // Add section to list
            $sections[] = $sectiondata;
        }

        // Handle delegated sections (subsections)
        foreach ($sectioninfos as $sectionnum => $sectioninfo) {
            if (!$sectioninfo->is_delegated()) {
                continue;
            }

            // This is a delegated section - it belongs to a specific activity
            // Find the parent activity that "owns" this subsection
            $subsectioncm = $modinfo->get_cm($sectioninfo->itemid);
            if (!$subsectioncm) {
                continue;
            }

            // Get the section that contains this subsection's parent activity
            $parentsection = $modinfo->get_section_info_by_num($subsectioncm->sectionnum);

            // Find which section in our list has this subsection
            foreach ($sections as &$section) {
                foreach ($section['activities'] as &$activity) {
                    if ($activity['cmid'] == $subsectioncm->id) {
                        // This activity contains our subsection
                        $subsectiondata = [
                            'id' => $sectioninfo->id,
                            'section' => $sectionnum,
                            'name' => !empty($sectioninfo->name) ? format_string($sectioninfo->name) : get_string('subsection', 'local_ai_content', $sectionnum),
                            'activities' => [],
                            'subsectionid' => $sectioninfo->itemid,
                        ];

                        // Get activities in this delegated section
                        if (!empty($sectioninfo->sequence)) {
                            $cmidsinsubsection = explode(',', $sectioninfo->sequence);
                            foreach ($cmidsinsubsection as $cmid) {
                                $cm = $modinfo->get_cm($cmid);
                                if (!$cm->uservisible) {
                                    continue;
                                }

                                $config = isset($contentconfigs[$cmid]) ? $contentconfigs[$cmid] : null;

                                // Only include activities that have a contentconfig record with allowindex = 1
                                if (empty($config) || empty($config->allowindex)) {
                                    continue;
                                }

                                $subsectiondata['activities'][] = [
                                    'cmid' => $cmid,
                                    'name' => format_string($cm->name),
                                    'checked' => !empty($config->allowindex),
                                    'sectionid' => $parentsection->id,
                                    'subsectionid' => $sectioninfo->itemid,
                                ];
                            }
                        }

                        $section['subsections'][] = $subsectiondata;
                        break 2;
                    }
                }
            }
        }

        return $sections;
    }

    /**
     * Get HTML for help button
     *
     * @return string
     */
    public function getHelpButton() {
        return $this->_helpbutton;
    }

    /**
     * Sets label to be hidden
     *
     * @param bool $hiddenLabel sets if label should be hidden
     * @return void
     */
    public function setHiddenLabel($hiddenLabel) {
        $this->_hiddenLabel = $hiddenLabel;
    }

    /**
     * Returns the type of template to use for this element
     *
     * @return string
     */
    public function getElementTemplateType() {
        return $this->_elementTemplateType;
    }

    /**
     * Prepare the data structure for the template
     *
     * @param renderer_base $output The renderer
     * @return array Template context
     */
    public function export_for_template(renderer_base $output) {
        $context = [];

        // Standard element attributes
        $standardattributes = ['id', 'name', 'label', 'error', 'size', 'value', 'type'];
        foreach ($standardattributes as $attr) {
            $context[$attr] = $this->getAttribute($attr) ?? '';
        }

        // Build sections if not already done
        $sections = $this->getSections();

        // Build context for each section
        $sectionsdata = [];
        foreach ($sections as $section) {
            $hasactivities = !empty($section['activities']) || !empty($section['subsections']);
            if (!$this->showemptysections && !$hasactivities) {
                continue;
            }

            $sectiondata = [
                'id' => $section['id'],
                'name' => $section['name'],
                'hasactivities' => $hasactivities,
                'activities' => [],
                'subsections' => [],
            ];

            foreach ($section['activities'] as $activity) {
                $sectiondata['activities'][] = [
                    'cmid' => $activity['cmid'],
                    'name' => $activity['name'],
                    'checked' => $activity['checked'],
                    'sectionid' => $activity['sectionid'],
                    'subsectionid' => null,
                ];
            }

            foreach ($section['subsections'] as $subsection) {
                $subsectiondata = [
                    'id' => $subsection['id'],
                    'name' => $subsection['name'],
                    'activities' => [],
                ];

                foreach ($subsection['activities'] as $activity) {
                    $subsectiondata['activities'][] = [
                        'cmid' => $activity['cmid'],
                        'name' => $activity['name'],
                        'checked' => $activity['checked'],
                        'sectionid' => $activity['sectionid'],
                        'subsectionid' => $activity['subsectionid'],
                    ];
                }

                $sectiondata['subsections'][] = $subsectiondata;
            }

            $sectionsdata[] = $sectiondata;
        }

        $context['sections'] = $sectionsdata;
        $context['wrapperid'] = 'fitem_' . $context['id'];
        $context['element']['type'] = 'ragcontexts';
        $context['element']['wrapperid'] = $context['wrapperid'];
        $context['element']['hiddenlabel'] = $this->_hiddenLabel;

        return $context;
    }

    /**
     * Get sections data
     *
     * @return array
     */
    private function getSections() {
        if (empty($this->sections)) {
            $this->sections = $this->buildSectionsData();
        }
        return $this->sections;
    }

    /**
     * Returns the disabled field HTML
     *
     * @return string
     */
    public function getFrozenHtml() {
        $html = '<div class="ragcontexts-frozen">';
        foreach ($this->getSections() as $section) {
            $html .= '<div class="ragcontexts-section-frozen">';
            $html .= '<strong>' . s($section['name']) . '</strong><br/>';

            foreach ($section['activities'] as $activity) {
                if (in_array($activity['cmid'], $this->selected)) {
                    $html .= '- ' . s($activity['name']) . '<br/>';
                }
            }

            foreach ($section['subsections'] as $subsection) {
                $html .= '&nbsp;&nbsp;<strong>' . s($subsection['name']) . '</strong><br/>';
                foreach ($subsection['activities'] as $activity) {
                    if (in_array($activity['cmid'], $this->selected)) {
                        $html .= '&nbsp;&nbsp;- ' . s($activity['name']) . '<br/>';
                    }
                }
            }
            $html .= '</div>';
        }
        $html .= '</div>';

        return $html;
    }

    /**
     * Accepts a renderer
     *
     * This method overrides the default rendering to use the mustache template
     * for the ragcontexts element. This allows us to render the element using
     * the local_ai_content/element-ragcontexts template instead of the default
     * HTML_QuickForm_Renderer behavior.
     *
     * @param HTML_QuickForm_Renderer $renderer An HTML_QuickForm_Renderer object
     * @param bool $required Whether the element is required
     * @param string $error An error message associated with the element
     * @return void
     */
    public function accept(&$renderer, $required = false, $error = null) {
        global $OUTPUT;
        debugging('in ragcontexts::accept() for element: ' . $this->getName(), DEBUG_DEVELOPER);

        $elementname = $this->getName();

        // Make sure the element has an id.
        $this->_generateId();
        $advanced = isset($renderer->_advancedElements[$elementname]);

        // Export the element context using our export_for_template method
        $elementcontext = $this->export_for_template($OUTPUT);

        $helpbutton = '';
        if (method_exists($this, 'getHelpButton')) {
            $helpbutton = $this->getHelpButton();
        }
        $label = $this->getLabel();

        // Generate the form element wrapper id
        $elementcontext['wrapperid'] = 'fitem_' . $elementcontext['id'];

        $context = [
            'element' => $elementcontext,
            'label' => $label,
            'text' => '',
            'required' => $required,
            'advanced' => $advanced,
            'helpbutton' => $helpbutton,
            'error' => $error,
        ];

        $html = $OUTPUT->render_from_template('local_ai_content/element-ragcontexts', $context);

        if ($renderer->_inGroup) {
            $this->_groupElementTemplate = $html;
        }
        if (($renderer->_inGroup) && !empty($renderer->_groupElementTemplate)) {
            $renderer->_groupElementTemplate = $html;
        } else if (!isset($renderer->_templates[$elementname])) {
            $renderer->_templates[$elementname] = $html;
        }

        if (in_array($elementname, $renderer->_stopFieldsetElements) && $renderer->_fieldsetsOpen > 0) {
            $renderer->_html .= $renderer->_closeFieldsetTemplate;
            $renderer->_fieldsetsOpen--;
        }
        $renderer->_html .= $html;
    }
}
