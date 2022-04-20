/**
 * WebstrateComponents Tools
 * 
 * Ease-of-use tools to help manage WPM package info and templates
 *
 * Copyright 2019, 2020, 2021 Rolf Bagge, Janus Bager Kristensen,
 * CAVI - Center for Advanced Visualisation and Interaction,
 * Aarhus University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/**
 * @namespace WebstrateComponents
 */
window.WebstrateComponents = {};

/**
 * A collection of tools
 * @type {WebstrateComponents.Tools}
 * @hideconstructor
 */
WebstrateComponents.Tools = class Tools {
    /**
     * Tries to extract the entry with the given key from the given config. If key does not exist, returns defaultValue instead.
     * @param {Object} config - The configuration to extract the entry from
     * @param {String} key - The key of the entry to extract
     * @param {*} [defaultValue=null] - The default value to return if the key does not exist.
     */
    static fromConfig(config, key, defaultValue = null) {
        if(config != null && config[key] != null) {
            return config[key];
        }

        return defaultValue;
    }

    /**
     * Loads a template from the document and returns it
     * @param {String} id - The identifier of the template to load
     * @returns {Element} - The loaded template
     */
    static loadTemplate(id) {
        if(!id.startsWith("#")) {
            id = "#" + id;
        }

        let fragment = document.importNode(document.querySelector(id).content, true);

        if(fragment.children.length > 1) {
            console.warn("Template had more than 1 direct child:", id, fragment);
        }

        return fragment.children[0];
    }

    /**
     * Tests if the given testElement is inside the given elm
     * @param {Element} elm
     * @param {Element} testElement
     */
    static isInsideElement(elm, testElement) {
        let parent = testElement;

        while(parent != null) {
            if(parent === elm) {
                return true;
            }

            parent = parent.parentNode;
        }

        return false;
    }
};