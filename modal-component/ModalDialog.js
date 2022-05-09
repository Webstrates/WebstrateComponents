/**
 *  Modal
 *  Provides a way to open modal dialogs
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

/* global mdc */

/**
 * @typedef {Object} ModalDialog~ModalDialogOptions
 * @property {string} [title=""] - The dialog title
 * @property {boolean} [closeOnOutsideClick=true] - Automatically close the dialog when clicking outside the dialog
 * @property {boolean} [closeOnEscape=true] - Automatically close the dialog when ESCAPE is pressed
 * @property {boolean} [autoStackButtons=true] - Automatically stack buttons if they do not fit horizontally
 */

/**
 * Modal component using MDCDialog as a framework
 */
class ModalDialog {

    /**
     * Creates a new ModalDialog
     * @param {Node} content - The content to place inside the Dialog
     * @param {ModalDialog~ModalDialogOptions} [options]
     */
    constructor(content, options = {}) {
        const self = this;

        const defaultOptions = {
            title: "",
            classes: [],
            closeOnOutsideClick: true,
            closeOnEscape: true,
            autoStackButtons: true,
            maximize: false,
            actions: {}
        };

        this.uuid = UUIDGenerator.generateUUID("dialog-");

        this.options = Object.assign({}, defaultOptions, options);

        this.html = WebstrateComponents.Tools.loadTemplate("#webstrate-components-modal-dialog-tpl");

        this.title = this.html.querySelector(".mdc-dialog__title");
        this.content = this.html.querySelector(".mdc-dialog__content");
        this.actions = this.html.querySelector(".mdc-dialog__actions");

        this.title.id = this.uuid + "-title";
        this.content.id = this.uuid + "-content";

        this.html.querySelector(".mdc-dialog__surface").setAttribute("aria-labelledby", this.title.id);
        this.html.querySelector(".mdc-dialog__surface").setAttribute("aria-describedby", this.content.id);

        // Action buttons
        if (this.options.actions === null || Object.keys(this.options.actions).length===0){
                this.actions.remove();
        } else {
                for (const [action, actionOptions] of Object.entries(this.options.actions)) {
                        let actionButton = document.createElement("button");
                        actionButton.classList.add("mdc-button");
                        actionButton.classList.add("mdc-dialog__button");
                        if (actionOptions.primary){
                                actionButton.classList.add("mdc-button--raised");
                        }
                        actionButton.setAttribute("data-mdc-dialog-action", action);
                        
                        if (actionOptions.mdcIcon){
                                let icon = document.createElement("i");
                                icon.classList.add("material-icons");
                                icon.classList.add("mdc-button__icon");
                                icon.innerText = actionOptions.mdcIcon;
                                actionButton.appendChild(icon);
                        }
                        
                        let ripple = document.createElement("div");
                        ripple.classList.add("mdc-button__ripple");
                        actionButton.appendChild(ripple);
                        
                        let label = document.createElement("span");
                        label.classList.add("mdc-button__label");
                        if (actionOptions.label){
                                label.innerText = actionOptions.label;
                        } else {
                                label.innerText = action;
                        }
                        actionButton.append(label);
                        
                        this.actions.appendChild(actionButton);
                }
        }

        this.content.appendChild(content);
        if(this.options.title != null && this.options.title.trim() !== "") {
            this.title.textContent = this.options.title.trim();
        } else {
            this.title.remove();
        }

        if(this.options.classes != null) {
            let classes = this.options.classes;
            if(!Array.isArray(classes)) {
                classes = [classes];
            }

            classes.forEach((c)=>{
                this.html.classList.add(c);
            });
        }

        if (this.options.maximize){
            this.html.classList.add("wc-modal-maximized");
        }
        
        this.dialog = new mdc.dialog.MDCDialog(this.html);

        //Dont add anything to body!
        this.dialog.foundation.adapter.addBodyClass = ()=>{};

        this.dialog.autoStackButtons = this.options.autoStackButtons;

        if(!this.options.closeOnEscape) {
            this.dialog.escapeKeyAction = "";
        }

        if(!this.options.closeOnOutsideClick) {
            this.dialog.scrimClickAction = "";
        }

        this.dialog.listen("MDCDialog:opening", (evt)=>{
            EventSystem.triggerEvent("ModalDialog.Opening", {
                dialog: self
            });
        });

        this.dialog.listen("MDCDialog:opened", (evt)=>{
            EventSystem.triggerEvent("ModalDialog.Opened", {
                dialog: self
            });
        });

        this.dialog.listen("MDCDialog:closing", (evt)=>{
            EventSystem.triggerEvent("ModalDialog.Closing", {
                dialog: self,
                action: evt.detail.action
            });
        });

        this.dialog.listen("MDCDialog:closed", (evt)=>{
            EventSystem.triggerEvent("ModalDialog.Closed", {
                dialog: self,
                action: evt.detail.action
            });
        });
    }

    open() {
        this.dialog.open();
    }

    close(action = null) {
        this.dialog.close(action);
    }
}

window.WebstrateComponents.ModalDialog = ModalDialog;
