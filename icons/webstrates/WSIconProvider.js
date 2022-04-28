/**
 *  WSIconProvider
 *  A provider for webstrates icons
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
    
window.WSIconProvider = class WSIconProvider {
    constructor(){
        this.supportedTypes = [
            "webstrates:logo",
            "webstrates:wpm-package-open",
            "webstrates:wpm-package-closed",
            "webstrates:cauldron",
            "webstrates:codestrates",
            "webstrates:components",
            "webstrates:varv"
        ];
    }
    
    provides(iconIdentifier){
        return this.supportedTypes.includes(iconIdentifier);
    }
    
    createIcon(iconIdentifier) {
            let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            let link = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            link.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#'+iconIdentifier.replace(/webstrates:/g, '')+"-icon");
            icon.appendChild(link);
            return icon;
    }
};

IconRegistry.registerProvider(new WSIconProvider());