/**
 *  Material Buttons
 *  Provides MDC buttons
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
    
ButtonSystem.MaterialBuilder = class MaterialBuilder {
    static buildButton(button) {
        let buttonHtml = WebstrateComponents.Tools.loadTemplate("ButtonSystem_MaterialDesign_Button");

        buttonHtml.querySelector(".mdc-button__label").textContent = button.text;

        let buttonType = WebstrateComponents.Tools.fromConfig(button.options, "style", "text");

        switch(buttonType) {
            case "text":
                break;
            case "outlined":
            case "raised":
            case "unelevated":
                buttonHtml.classList.add("mdc-button--"+buttonType);
                break;
        }

        let icon = WebstrateComponents.Tools.fromConfig(button.options, "icon", null);

        if(icon != null) {
            let filteredClasses = Array.from(icon.classList.values()).filter((c)=>{
                return c.startsWith("material-icons");
            });
            if(filteredClasses.length > 0) {
                icon.classList.add("mdc-button__icon");
            }

            if(WebstrateComponents.Tools.fromConfig(button.options, "iconTrailing", false)) {
                buttonHtml.appendChild(icon);
            } else {
                buttonHtml.insertBefore(icon, buttonHtml.firstChild);
            }
        }

        mdc.ripple.MDCRipple.attachTo(buttonHtml);

        return buttonHtml;
    }
}

ButtonSystem.ButtonFactory.setDefaultBuilder(ButtonSystem.MaterialBuilder);