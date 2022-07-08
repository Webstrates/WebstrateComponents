/**
 *  MaterialMenuBuilder
 *  MDC binding for visual presentation of menus
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

/*global mdc*/

window.MenuSystem.MaterialMenuBuilder = class MaterialMenuBuilder extends MenuSystem.MenuBuilder {
    static buildMenuHtml(menu) {
        let tpl = WebstrateComponents.Tools.loadTemplate("MenuSystem_MaterialMenu_Menu");
        
        //Setup MDC menu
        tpl.mdcMenu =  new mdc.menu.MDCMenu(tpl);

        if(menu.options.defaultFocusState != null) {
            tpl.mdcMenu.setDefaultFocusState(menu.options.defaultFocusState);
        }

        //Hook mdc-menu-surface close
        let origClose = tpl.mdcMenu["menuSurface_"]["foundation"]["close"];

        tpl.mdcMenu.realClose = function () {
            origClose.call(tpl.mdcMenu["menuSurface_"]["foundation"]);
        };

        tpl.mdcMenu["menuSurface_"]["foundation"]["close"] = function() {
            //Empty on purpose
        };

        //Setup listeners
        tpl.mdcMenu.listen("MDCMenu:selected", (evt)=>{
            menu.handleItemAction(evt.detail.item.menuItem);
        });

        return tpl;
    }

    static buildMenuItemHtml(menuItem) {
        let tpl = WebstrateComponents.Tools.loadTemplate("MenuSystem_MaterialMenu_MenuItem");
        
        tpl.querySelector(".mdc-list-item__text").textContent = menuItem.label;
        tpl.menuItem = menuItem;

        if(menuItem.icon != null) {
            let iconTpl = WebstrateComponents.Tools.loadTemplate("MenuSystem_MaterialMenu_MenuItem_Icon");
            tpl.insertBefore(iconTpl, tpl.firstChild);
            if(typeof menuItem.icon === "string") {
                iconTpl.textContent = menuItem.icon;
            } else if(menuItem.icon instanceof HTMLElement || menuItem.icon instanceof SVGElement) {
                iconTpl.appendChild(menuItem.icon.cloneNode(true));
            }
        }

        if(menuItem.metaIcon != null) {
            let metaIconTpl = WebstrateComponents.Tools.loadTemplate("MenuSystem_MaterialMenu_MenuItem_MetaIcon");
            tpl.insertBefore(metaIconTpl, tpl.lastChild.nextSibling);
            if(typeof menuItem.metaIcon === "string") {
                metaIconTpl.textContent = menuItem.metaIcon;
            } else if(menuItem.metaIcon instanceof HTMLElement) {
                metaIconTpl.appendChild(menuItem.metaIcon.cloneNode(true));
            }
        }
        
        if (menuItem.tooltip != null){
            tpl.setAttribute("title", menuItem.tooltip);
        }        
        
        mdc.ripple.MDCRipple.attachTo(tpl);

        if (menuItem.checked != null){
            // This is a toggle-able item, upgrade it with additional UI elements and update the state
            let checkmarkTemplate = WebstrateComponents.Tools.loadTemplate("MenuSystem_MaterialMenu_Checkmark");
            tpl.insertBefore(checkmarkTemplate, tpl.lastChild.nextSibling);
            tpl.classList.add("mdc-menu__selection-group");
            
            let wrapper = document.createElement("div");
            wrapper.classList.add("mdc-menu__selection-group");
            wrapper.appendChild(tpl);
            tpl = wrapper;
        }
        return tpl;
    }

    static clearMenuItems(menu) {
        let menuItemInsertLocation = menu.html.querySelector(".mdc-list");
        while(menuItemInsertLocation.lastChild) {
            menuItemInsertLocation.removeChild(menuItemInsertLocation.lastChild);
        }
    }

    static attachMenuItems(menu, groups) {
        let menuItemInsertLocation = menu.html.querySelector(".mdc-list");

        let first = true;

        groups.forEach((group)=>{
            if(first) {
                first = false;
            } else {
                if(menu.groupDividers) {
                    let groupDivider = WebstrateComponents.Tools.loadTemplate("MenuSystem_MaterialMenu_GroupDivider");
                    menuItemInsertLocation.appendChild(groupDivider);
                }
            }

            group.forEach((item)=>{
                menuItemInsertLocation.appendChild(item.html);
                
                // Update checked status
                if (item.checked!==null){
                    try {
                        if (item.checked()){
                            item.html.querySelector(".mdc-list-item").classList.add("mdc-menu-item--selected");
                        } else {
                            item.html.querySelector(".mdc-list-item").classList.remove("mdc-menu-item--selected");
                        }
                    } catch (ex){
                        console.warn("MenuItem caused exception in .checked ",item,ex);
                    }
                }
            });
        });
    }

    static open(menu, source) {
        if(source != null) {
            if(source.x != null && source.y != null) {
                menu.html.mdcMenu.setFixedPosition(true);
                menu.html.mdcMenu.setAbsolutePosition(source.x, source.y);
            } else if(source instanceof HTMLElement) {
                //Try fixed always if using anchor source?
                menu.html.mdcMenu.setFixedPosition(true);

                menu.html.mdcMenu.setAnchorElement(source);

                switch(menu.growDirection) {
                    case MenuSystem.Menu.GrowDirection.DOWN:
                        menu.html.mdcMenu.setAnchorCorner(mdc.menuSurface.Corner.BOTTOM_LEFT);
                        break;
                    case MenuSystem.Menu.GrowDirection.RIGHT:
                    default:
                        menu.html.mdcMenu.setAnchorCorner(mdc.menuSurface.Corner.TOP_RIGHT);
                        menu.html.mdcMenu.setAnchorMargin({
                            top: -10
                        });
                }
            }
            menu.html.style.zIndex = 9000;           
        }

        if (menu.layoutDirection==MenuSystem.Menu.LayoutDirection.HORIZONTAL){
            menu.html.classList.add("mdc-tweaks-horizontal-menu");
        }
        if (menu.layoutWrapping===false){
            menu.html.classList.add("mdc-tweaks-nonwrapping-menu");
        }        
        if (menu.layoutCompact===true){
            menu.html.classList.add("mdc-tweaks-compact-menu");
        }

        if(!menu.defaultFocus) {
            menu.html.mdcMenu.setDefaultFocusState(0);
        }

        menu.html.mdcMenu.open = true;
    }

    static close(menu) {
        menu.html.mdcMenu.realClose();
    }

    static destroyMenu(menu) {
        menu.html.mdcMenu.destroy();
        delete menu.html["mdcMenu"];
    }

    static destroyMenuItem(item) {
    }
    
    static setItemActive(item, active){
        if(active) {
            item.html.classList.add("mdc-list-item--activated");
        } else {
            item.html.classList.remove("mdc-list-item--activated");
        }
    }

    static createSubmenuIcon() {
        return IconRegistry.createIcon("mdc:chevron_right");
    }
};

MenuSystem.MenuManager.createMaterialMenu = (menuName, menuConfig = {}) => {
    menuConfig.builder = MenuSystem.MaterialMenuBuilder;
    return MenuSystem.MenuManager.createMenu(menuName, menuConfig);
};

MenuSystem.MenuManager.setDefaultBuilder(MenuSystem.MaterialMenuBuilder);
