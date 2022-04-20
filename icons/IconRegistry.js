/**
 *  IconRegistry
 *  Register icons and use them on the page
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

window.IconRegistry = class IconRegistry {   
    static registerProvider(iconProvider){
        IconRegistry.iconProviders.push(iconProvider);
        
        // TODO: update all icons
    }
        
    static createIcon(iconIdentifier){        
        let icon = null;
        let searchPath = null;
        
        if (Array.isArray(iconIdentifier)){
            searchPath = iconIdentifier;
        } else {        
            searchPath = [iconIdentifier];
        }

        // Query each icon or fallback in order
        search: for (const attempt of searchPath){
            for (const provider of IconRegistry.iconProviders){
                if (provider.provides(attempt)){
                    icon = provider.createIcon(attempt);
                    break search;
                }
            }
        }        

        
        // Ultimate fallback is invisible
        if (icon===null){
            icon = document.createElement("span");
        }
        icon.classList.add("wsc-registry-icon");
        icon.wscIconIdentifier = iconIdentifier;
        
        return icon;
    }
};
window.IconRegistry.iconProviders = [];