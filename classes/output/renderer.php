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

/**
 * Renderer for local_ai_content plugin.
 *
 * @package    local_ai_content
 * @copyright  2026 Michael Hughes
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_ai_content\output;

use MoodleQuickForm_Renderer;

/**
 * Custom renderer for local_ai_content form elements.
 *
 * Extends MoodleQuickForm_Renderer to add row class to fitem div
 * for proper flexbox layout in the form.
 *
 * @package    local_ai_content
 * @copyright  2026 Michael Hughes
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class renderer extends MoodleQuickForm_Renderer {
    /**
     * Constructor
     */
    public function __construct() {
        parent::__construct();
        // Override the default template to add row class and fix label replacement
        $this->_elementTemplates = [
            'default' => "\n\t\t" . '<div id="{id}" class="fitem row {advanced}<!-- BEGIN required --> required<!-- END required --> fitem_{typeclass} {emptylabel} {class}" {aria-live} {groupname}><div class="fitemtitle"><label>{label}<!-- BEGIN required -->{req}<!-- END required -->{advancedimg} </label>{help}</div><div class="felement {typeclass}<!-- BEGIN error --> error<!-- END error -->" data-fieldtype="{type}"><!-- BEGIN error --><span class="error" tabindex="0">{error}</span><br /><!-- END error -->{element}</div></div>',
            'actionbuttons' => "\n\t\t" . '<div id="{id}" class="fitem row fitem_actionbuttons fitem_{typeclass} {class}" {groupname}><div class="felement {typeclass}" data-fieldtype="{type}">{element}</div></div>',
            'fieldset' => "\n\t\t" . '<div id="{id}" class="fitem row {advanced} {class}<!-- BEGIN required --> required<!-- END required --> fitem_{typeclass} {emptylabel}" {groupname}><div class="fitemtitle"><div class="fgrouplabel"><label>{label}<!-- BEGIN required -->{req}<!-- END required -->{advancedimg} </label>{help}</div></div><fieldset class="felement {typeclass}<!-- BEGIN error --> error<!-- END error -->" data-fieldtype="{type}"><!-- BEGIN error --><span class="error" tabindex="0">{error}</span><br /><!-- END error -->{element}</fieldset></div>',
            'static' => "\n\t\t" . '<div id="{id}" class="fitem row {advanced} {emptylabel} {class}" {groupname}><div class="fitemtitle"><div class="fstaticlabel">{label}<!-- BEGIN required -->{req}<!-- END required -->{advancedimg} {help}</div></div><div class="felement fstatic <!-- BEGIN error --> error<!-- END error -->" data-fieldtype="static"><!-- BEGIN error --><span class="error" tabindex="0">{error}</span><br /><!-- END error -->{element}</div></div>',
            'warning' => "\n\t\t" . '<div id="{id}" class="fitem row {advanced} {emptylabel} {class}">{element}</div>',
            'nodisplay' => '',
        ];
    }
}
