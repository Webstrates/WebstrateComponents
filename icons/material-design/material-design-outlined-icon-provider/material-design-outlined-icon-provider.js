/**
 *  MaterialDesignOutlinedIconProvider
 *  A provider for registering material icons
 * 
 *  Copyright 2020, 2021, 2024 Rolf Bagge, Janus B. Kristensen, CAVI,
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
 * A provider for registering material icons in the outlined variation
 */
window.MaterialDesignOutlinedIconProvider = class MaterialDesignOutlinedIconProvider {
    provides(iconIdentifier){
        return iconIdentifier.startsWith("mdc:");
    }
    
    /**
     * Create a MaterialDesign icon
     * @param {String} iconIdentifier - The id of the icon
     * @returns {HTMLSpanElement} - The created icon
     */
    createIcon(iconIdentifier) {
        let iconName = iconIdentifier.slice(4);
        
        let icon = document.createElement("span");
        icon.classList.add("material-icons-outlined");
        icon.textContent = iconName;
        return icon;
    }
};

IconRegistry.registerProvider(new MaterialDesignOutlinedIconProvider());