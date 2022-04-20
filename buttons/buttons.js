/**
 *  Button System
 *  Provides easily usable buttons
 * 
 *  Copyright 2020, 2021 Rolf Bagge, Janus B. Kristensen, CAVI,
 *  Center for Advanced Visualization and Interacion, Aarhus University
 *    
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
**/

/**
 * @namespace ButtonSystem
 */
window.ButtonSystem = {};

/**
 * @typedef {Object} ButtonSystem~ButtonConfig
 * @property {ButtonSystem.ButtonBuilder} [builder] - The builder to use when creating the button, if not specified, the DefaultBuilder will be used.
 * @property {'text'|'outlined'|'raised'|'unelevated'} [style='text'] - The style of the button
 * @property {Element} [icon] - An icon to add to the button
 * @property {boolean} [iconTrailing=true] - Wether the icon should be trailing the button text
 * @property {Function} [onAction] - The callback to run when the button has its action triggered
 */

/**
 * ButtonFactory can create buttons
 */
ButtonSystem.ButtonFactory = class ButtonFactory {
    /**
     * Create a new button
     *
     * @example
     * ButtonFactory.createButton("MyButton", {
     *     style: "outlined",
     *     onAction: ()=>{
     *         //Someone pressed my button
     *     }
     * });
     *
     * @param {String} text - The text of the button
     * @param {ButtonSystem~ButtonConfig} options
     * @returns {ButtonSystem.Button}
     */
    static createButton(text, options) {
        if(options.builder == null) {
            if(ButtonFactory.defaultBuilder == null) {
                throw "Attempt to create Button with defaultBuilder but no default builder is set!";
            }

            options.builder = ButtonFactory.defaultBuilder;
        }

        if(options.style == null) {
            options.style = "text";
        }

        return new ButtonSystem.Button(text, options);
    }
    
    /**
     * Sets the defailt button builder
     * @param {ButtonBuilder} builder
     */
    static setDefaultBuilder(builder) {
        ButtonFactory.defaultBuilder = builder;
    }
}

ButtonSystem.ButtonFactory.defaultBuilder = null;

ButtonSystem.ButtonBuilder = class ButtonBuilder {
    /**
     * Build the DOM for the given button
     * @param button
     */
    static buildButton(button) {
        //Override in subclass
    }
}

/**
 * Button represents a Button
 * @type {ButtonSystem.Button}
 */
ButtonSystem.Button = class Button {
    /**
     * @param {String} text - The text of the button
     * @param {ButtonSystem~ButtonConfig} options
     */
    constructor(text, options) {
        let self = this;

        this.text = text;
        this.options = options;

        /** @member {Element} - The DOM element of this button */
        this.html = this.options.builder.buildButton(this);

        this.html.addEventListener("click", ()=>{
            if(self.options.onAction != null) {
                self.options.onAction();
            }
        });
    }
}
