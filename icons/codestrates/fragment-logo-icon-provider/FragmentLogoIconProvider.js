/**
 *  FragmentLogoIconProvider
 *  A provider for Codestrate fragment type icons
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
 * A provider for Codestrate fragment type icons
 */
window.FragmentLogoIconProvider = class FragmentLogoIconProvider {
    provides(iconIdentifier){
        return iconIdentifier.startsWith("code-fragment:");
    }
    
    /**
     * Create an icon
     */
    createIcon(iconIdentifier) {
        let mimeType = iconIdentifier.slice(14);
        /*
          "wpm/descriptor": (
            base: #000080,
            text: #A0A0FF,
            name: 'WPM Package Descriptor',
            type: 'wpm'
          ),
        */
        let supportedTypes = [
            "text/html",
            "text/javascript",
            "text/javascript+babel",
            "text/css",
            "text/x-typescript",
            "text/markdown",
            "text/x-latex",
            "image/svg+xml",
            "application/json",
            "text/p5js",
            "text/ruby",
            "application/x-lua",
            "model/vnd.usda",
            "text/x-scss",
            "text/python"
        ];               
        if (mimeType==="text/javascript+babel") mimeType = "text/javascript";
        if (supportedTypes.includes(mimeType)){
            let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            let link = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            link.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#'+mimeType.replace(/(\/|\+)/g, "-"));
            icon.appendChild(link);
            return icon;
        }

        if (mimeType==="wpm/descriptor"){
            return IconRegistry.createIcon("mdc:list_alt");
        } else if (mimeType==="text/mirrorverse-audio-router"){
            return IconRegistry.createIcon("mdc:route");
        } else if (mimeType==="text/varv"){
            return IconRegistry.createIcon("webstrates:varv");
        }
        
        return null;
    }
}


/**
 * Icons for fragments
 * @type {FragmentIcons.IconProvider}
 * @hideconstructor
 */
IconRegistry.registerProvider(new FragmentLogoIconProvider());
