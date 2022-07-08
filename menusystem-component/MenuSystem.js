/**
 *  MenuSystem
 *  A system to dynamically register into a menu structure and present it visually
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
 * @namespace MenuSystem
 */
window.MenuSystem = {};

/**
 * @typedef {Object} MenuSystem~Point
 * @property {Number} x
 * @property {Number} y
 */

/**
 * @typedef {Object} MenuSystem.Menu~menuConfig
 * @property {MenuSystem.MenuBuilder} [builder=null] - The MenuBuilder to use when instanciating the Menu, if null the DefaultBuilder will be used instead.
 * @property {*} [context=null] - The context of this Menu
 * @property {Boolean} [keepOpen=false] - Should the Menu stay open when clicked
 * @property {Boolean} [groupDividers=false] - Should group dividers be visible
 * @property {function} [onOpen] - Called when the Menu is opened
 * @property {function} [onClose] - Called when the Menu is closed
 */

/**
 * @typedef {Object} MenuSystem.MenuItem~menuItemConfig
 * @property {String} [label] - The label of this MenuItem
 * @property {*} [icon] - The icon of this MenuItem
 * @property {Number} [order=99999] - The order of this MenuItem
 * @property {function} [onAction] - The callback to call when this MenuItem has its action triggered
 * @property {function} [onOpen] - Called when the Menu this MenuItem belongs to is about to open. If false is returned, this MenuItem will not be shown.
 * @property {MenuSystem.Menu} [submenu=null] - A submenu to open when clicking this MenuItem
 * @property {boolean} [submenuOnHover=true] - Determines if this MenuItem's submenu should open on hover
 * @property {String} [group] - The group this MenuItem should belong too
 * @property {Number} [groupOrder=99999] - If this MenuItem is part of a group, this is the order the group should have. (The lowest order of all members is choosen)
 */

/**
 * MenuManager is used to interact with menus in MenuSystem
 * @hideconstructor
 * @memberof MenuSystem
 */
MenuSystem.MenuManager = class MenuManager {
    /**
     * Registers a new MenuItem for the given named menu. MenuItem's can be registered both before and after the menu is created.
     * @param {String} menuName - The name of the menu to register this MenuItem for
     * @param {MenuSystem.MenuItem~menuItemConfig} menuItemConfig - The configuration for this MenuItem
     *
     * @returns {Object} - Delete object, with a single method delete(), that removes this menuItemConfig and all menuitems associated with it
     *
     * @example
     * MenuSystem.MenuManager.registerMenuItem("MyMenu", {
     *     label: "MyMenuItem",
     *     order: 10.
     *     onAction: ()=>{console.log("MyMenuItem clicked!");}
     *     onOpen: ()=>{return true;}
     * });
     */
    static registerMenuItem(menuName, menuItemConfig) {
        menuItemConfig._allMenuItems = new Set();

        //Register this MenuItem in the set
        let menuItemSet = MenuSystem.MenuManager.menuItemMap.get(menuName);
        if(menuItemSet == null) {
            menuItemSet = new Set();
            MenuSystem.MenuManager.menuItemMap.set(menuName, menuItemSet);
        }
        menuItemSet.add(menuItemConfig);

        //Add MenuItem to all menus already created
        let menuArray = MenuSystem.MenuManager.menuMap.get(menuName);
        if(menuArray != null) {
            menuArray.forEach((menu)=>{
                menuItemConfig._allMenuItems.add(menu.addItem(menuItemConfig));
            });
        }

        return {
            delete: ()=>{
                menuItemSet.delete(menuItemConfig);

                menuItemConfig._allMenuItems.forEach((menuItem)=>{
                    menuItem.menu.removeItem(menuItem);
                });
            }
        }
    }

    /**
     * Create a new menu
     * @param {String} menuName - The name of the Menu
     * @param {MenuSystem.Menu~menuConfig} [menuConfig] - The configuration of the Menu
     * @return {MenuSystem.Menu} - The created menu
     * 
     * @example
     * MenuSystem.MenuManager.createMenu("MyMenu", {
     *     context: myContext,
     *     builder: MenuSystem.MyLovelyMenuBuilder
     *     keepOpen: false,
     *     onOpen: ()=>{console.log("MyMenu was opened!")},
     *     onClose: ()=>{console.log("MyMenu was closed!")},
     * });
     */
    static createMenu(menuName, menuConfig = {}) {

        if(menuConfig.builder == null) {
            if(MenuSystem.MenuManager.defaultBuilder == null) {
                throw "Attempt to create Menu with defaultBuilder but no default builder is set!";
            }

            menuConfig.builder = MenuSystem.MenuManager.defaultBuilder;
        }

        //Build Menu
        let menu = new MenuSystem.Menu(menuConfig);

        //Add it to our map of named menus
        let menuArray = MenuSystem.MenuManager.menuMap.get(menuName);
        if(menuArray == null) {
            menuArray = [];
            MenuSystem.MenuManager.menuMap.set(menuName, menuArray);
        }
        menuArray.push(menu);

        //Add all registered menuItems
        let menuItemSet = MenuSystem.MenuManager.menuItemMap.get(menuName);
        if(menuItemSet != null) {
            menuItemSet.forEach((itemConfig)=>{
                itemConfig._allMenuItems.add(menu.addItem(itemConfig));
            });
        }

        return menu;
    }

    static setDefaultBuilder(builder) {
        MenuSystem.MenuManager.defaultBuilder = builder;
    }
};
MenuSystem.MenuManager.menuItemMap = new Map();
MenuSystem.MenuManager.menuItemDeleterMap = new Map();
MenuSystem.MenuManager.menuMap = new Map();
MenuSystem.MenuManager.defaultBuilder = null;

/**
 * MenuBuilder is used to build concrete instances of Menu's
 */
MenuSystem.MenuBuilder = class MenuBuilder {
    /**
     * Construct the HTML code for the given Menu
     * @param {MenuSystem.Menu} menu
     */
    static buildMenuHtml(menu) {
        //Override in subclass
        throw "Remember to override buildMenuHtml()";
    }

    /**
     * Construct the HTML code for the given MenuItem
     * @param {MenuSystem.MenuItem} menuItem 
     */
    static buildMenuItemHtml(menuItem) {
        //Override in subclass
        throw "Remember to override buildMenuItemHtml()";
    }

    /**
     * Clear all MenuItem's from the given Menu
     * @param {MenuSystem.Menu} menu
     */
    static clearMenuItems(menu) {
        //Override in subclass
        throw "Remember to override clearMenuItems()";
    }

    /**
     * Attach the given MenuItem's to the given Menu
     * @param {MenuSystem.Menu} menu 
     * @param {MenuSystem.MenuItem[][]} groups - Array of MenuItem arrays, where each outer array is a grouping of MenuItems
     */
    static attachMenuItems(menu, menuItems) {
        //Override in subclass
        throw "Remember to override attachMenuItems()";
    }

    /**
     * Opens the given Menu
     * 
     * The source parameter tells where the open event originated from, which can be a Element, or a 2D point
     * @param {MenuSystem.Menu} menu - The Menu to open
     * @param {Element|MenuSystem~Point} source - The source of the open event
     */
    static open(menu, source) {
        //Override in subclass
        throw "Remember to override open()";
    }

    /**
     * Closes the given Menu
     * @param {MenuSystem.Menu} menu 
     */
    static close(menu) {
        //Override in subclass
        throw "Remember to override close()";
    }

    /**
     * Destroy the given Menu
     * @param {MenuSystem.Menu} menu 
     */
    static destroyMenu(menu) {
        //Override in subclass
        throw "Remember to override destroyMenu()";
    }

    /**
     * Destroy the given MenuItem
     * @param {MenuSystem.MenuItem} menuItem
     */
    static destroyMenuItem(menuItem) {
        //Override in subclass
        throw "Remember to override destroyMenuItem()";
    }

    /**
     * Create an icon that represents a submenu
     */
    static createSubmenuIcon() {
        //Override in subclass
        throw "Remember to override createSubmenuIcon()";
    }
};

/**
 * Represents a Menu in the MenuSystem
 */
MenuSystem.Menu = class Menu {
    /**
     * Construct a new Menu
     * @param {MenuSystem.Menu~menuConfig} [options] - The options to use for this menu
     */
    constructor(options) {
        this.options = options;

        this.context = WebstrateComponents.Tools.fromConfig(options, "context", null);
        this.builder = WebstrateComponents.Tools.fromConfig(options, "builder", null);

        this.keepOpen = WebstrateComponents.Tools.fromConfig(options, "keepOpen", false);

        this.groupDividers = WebstrateComponents.Tools.fromConfig(options, "groupDividers", false);

        this.growDirection = WebstrateComponents.Tools.fromConfig(options, "growDirection", MenuSystem.Menu.GrowDirection.RIGHT);
        this.layoutDirection = WebstrateComponents.Tools.fromConfig(options, "layoutDirection", MenuSystem.Menu.LayoutDirection.VERTICAL);
        this.layoutWrapping = WebstrateComponents.Tools.fromConfig(options, "layoutWrapping", true);
        this.layoutCompact = WebstrateComponents.Tools.fromConfig(options, "layoutCompact", false);
        this.defaultFocus = WebstrateComponents.Tools.fromConfig(options, "defaultFocus", true);

        this.onOpen = new Set();
        let openCallback = WebstrateComponents.Tools.fromConfig(options, "onOpen");
        if(openCallback != null) {
            this.onOpen.add(openCallback);
        }

        this.onClose = new Set();
        let closeCallback = WebstrateComponents.Tools.fromConfig(options, "onClose");
        if(closeCallback != null) {
            this.onClose.add(closeCallback);
        }

        this.menuItems = [];

        this.isOpen = false;
        this.currentSubmenu = null;

        /** @member {Element} - The DOM Element of this Menu */
        this.html = this.builder.buildMenuHtml(this);
        this.html.menu = this;
        this.html.classList.add("menusystem-menu");

        let self = this;

        this.html.addEventListener("contextmenu", (evt)=>{
            evt.preventDefault();
        });

        this.bodyClickHandler = function(evt) {
            self.handleBodyClick(evt);
        }

        if(this.keepOpen) {
            this.open();
        }
    }

    /**
     * Register a callback to be called when this Menu opens
     * @param {Function} callback 
     */
    registerOnOpenCallback(callback) {
        this.onOpen.add(callback);
    }

    /**
     * Deregister a callback to be called when this Menu opens
     * @param {Function} callback 
     */
    deregisterOnOpenCallback(callback) {
        this.onOpen.delete(callback);
    }

    /**
     * Register a callback to be called when this Menu closes
     * @param {Function} callback 
     */
    registerOnCloseCallback(callback) {
        this.onClose.add(callback);
    }

    /**
     * Deregister a callback to be called when this Menu closes
     * @param {Function} callback 
     */
    deregisterOnCloseCallback(callback) {
        this.onClose.delete(callback);
    }

    /**
     * Add a MenuItem to this Menu
     * @param {MenuSystem.MenuItem~menuItemConfig} itemConfig
     * @return {MenuSystem.MenuItem} - The added item
     */
    addItem(itemConfig) {
        let menuItem = new MenuSystem.MenuItem(this.builder, this, itemConfig);
        this.menuItems.push(menuItem);

        this.checkUpdate();

        return menuItem;
    }

    /**
     * Remove a MenuItem from this Menu
     * @param {MenuSystem.MenuItem} menuItem - The menu item to remove
     */
    removeItem(menuItem) {
        this.menuItems.splice(this.menuItems.indexOf(menuItem), 1);

        this.checkUpdate();
    }

    /**
     * Opens this Menu
     * @param {Element|MenuSystem~Point} [source] - Some notion of the source that openend the Menu, could be a Element or a Point
     */
    open(source = null) {
        let self = this;

        if(this.closeTimeoutId != null) {
            clearTimeout(this.closeTimeoutId);
            this.closeTimeoutId = null;
        }

        let numItems = this.update();

        if(numItems === 0 && !this.keepOpen) {
            return;
        }

        this.builder.open(this, source);

        this.isOpen = true;

        setTimeout(()=>{
            window.addEventListener("mouseup", self.bodyClickHandler, {
                capture: true
            });
        }, 0);

        this.triggerOnOpen();
    }

    checkUpdate() {
        if(this.isOpen) {
            let numItems = this.update();

            if(numItems === 0 && !this.keepOpen) {
                this.close();
            }
        }
    }

    /**
     * Updates the MenuItems in this menu.
     * @returns {number} - The number of items in the menu
     */
    update() {
        let self = this;

        this.builder.clearMenuItems(this);

        let groupMap = new Map();

        //Filter menu items
        let filteredMenuItems = this.menuItems.filter((item)=>{
            try {
                return item.onOpen(self, item);
            } catch (ex){
                console.warn("MenuSystem: Menu entry caused an exception while evaluating visibility, dropping: ", item, ex);
                return false;
            }
        });

        //Group items
        filteredMenuItems.forEach((item)=>{
            let group = groupMap.get(item.group);
            if(group == null) {
                group = [];
                groupMap.set(item.group, group);
            }

            group.push(item);
        });

        let groupArrays = Array.from(groupMap.values());

        //Sort Groups
        groupArrays.sort((g1, g2)=>{
            let g1MinGroupOrder = 99999999999;
            let g2MinGroupOrder = 99999999999;

            g1.forEach((item)=>{
                g1MinGroupOrder = Math.min(g1MinGroupOrder, item.groupOrder);
            });
            g2.forEach((item)=>{
                g2MinGroupOrder = Math.min(g2MinGroupOrder, item.groupOrder);
            });

            return g1MinGroupOrder - g2MinGroupOrder;
        });

        //Sort items in each group
        groupArrays.forEach((group)=>{
            group.sort((i1, i2) => {
                return i1.order - i2.order;
            });
        });

        this.builder.attachMenuItems(this, groupArrays);

        return filteredMenuItems.length;
    }

    /**
     * Close this Menu
     */
    close() {
        if(!this.isOpen) {
            return;
        }

        this.builder.close(this);

        this.isOpen = false;

        window.removeEventListener("mouseup", this.bodyClickHandler, {
            capture: true
        });

        this.triggerOnClose();
    }

    /**
     * Destroy this menu
     */
    destroy() {
        this.menuItems.forEach((item)=>{
            item.destroy();
        });

        this.builder.destroyMenu(this);
    }

    /**
     * Trigger the onOpen callback attached to this Menu
     * @private
     */
    triggerOnOpen() {
        let self = this;
        this.onOpen.forEach((callback)=>{
            if(typeof callback === "function") {
                try {
                    callback(self);
                } catch(e) {
                    console.error("Error inside onOpen:", e);
                }
            }
        });
    }

    /**
     * Trigger the onClose callback attached to this Menu
     * @private
     */
    triggerOnClose() {
        let self = this;
        this.onClose.forEach((callback)=>{
            if(typeof callback === "function") {
                try {
                    callback(self);
                } catch(e) {
                    console.error("Error inside onClose:", e);
                }
            }
        });
    }

    /**
     * Closes all submenus except on the given MenuItem
     * @param {MenuSystem.MenuItem} menuItem
     */
    closeAllOtherSubmenus(menuItem) {
        this.menuItems.forEach((item)=>{
            if(item != menuItem && item.submenu != null && item.submenu.isOpen) {
                item.toggleSubmenu();
            }
        });
    }

    /**
     * Signals to this Menu that the given MenuItem has been triggered
     * @private
     * @param {MenuSystem.MenuItem} menuItem 
     */
    handleItemAction(menuItem) {
        menuItem.triggerOnAction();

        if(!this.keepOpen && menuItem.submenu == null) {
            this.close();
        }
    }

    /**
     * Handles clicks to the document, to check if we should close if clicked outside
     * @private
     * @param {MouseEvent} evt 
     */
    handleBodyClick(evt) {
        let self = this;

        if(!WebstrateComponents.Tools.isInsideElement(this.html, evt.target)) {
            this.closeTimeoutId = setTimeout(()=>{
                this.closeTimeoutId = null;

                let shouldClose = !self.keepOpen && self.currentSubmenu == null;

                if(shouldClose) {
                    self.close();
                }
            }, 0);
        }
    }
};

MenuSystem.Menu.GrowDirection = {
    RIGHT: "right",
    DOWN: "down"
};
MenuSystem.Menu.LayoutDirection = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
};

/**
 * Represents a MenuItem in the MenuSystem
 */
MenuSystem.MenuItem = class MenuItem {
    /**
     * Construct a new MenuItem
     * @param {MenuSystem.MenuBuilder} builder 
     * @param {MenuSystem.Menu} menu 
     * @param {MenuSystem.MenuItem~menuItemConfig} config 
     */
    constructor(builder, menu, config) {
        let self = this;

        this.builder = builder;
        this.config = config;
        this.menu = menu;

        this.order = WebstrateComponents.Tools.fromConfig(config, "order", 99999);
        this.icon = WebstrateComponents.Tools.fromConfig(config, "icon", null);
        this.metaIcon = WebstrateComponents.Tools.fromConfig(config, "metaIcon", null);
        this.label = WebstrateComponents.Tools.fromConfig(config, "label", null);
        this.tooltip = WebstrateComponents.Tools.fromConfig(config, "tooltip", null);
        this.onAction = WebstrateComponents.Tools.fromConfig(config, "onAction", ()=>{});
        this.onOpen = WebstrateComponents.Tools.fromConfig(config, "onOpen", ()=>{return true;});
        this.submenuOnHover = WebstrateComponents.Tools.fromConfig(config, "submenuOnHover", true);
        this.group = WebstrateComponents.Tools.fromConfig(config, "group", null);
        this.groupOrder = WebstrateComponents.Tools.fromConfig(config, "groupOrder", 99999);
        this.class = WebstrateComponents.Tools.fromConfig(config, "class", null);
        this.checked = WebstrateComponents.Tools.fromConfig(config, "checked", null);

        this.submenu = WebstrateComponents.Tools.fromConfig(config, "submenu", null);

        if(this.submenu != null && this.metaIcon == null) {
            this.metaIcon = this.builder.createSubmenuIcon();
        }

        /** @member {Element} - The DOM Element of this MenuItem */
        this.html = builder.buildMenuItemHtml(this);

        if(this.class != null) {
            this.html.classList.add(this.class.split(" "));
        }

        this.submenuCloseHandler = () => {
            if(self.menu.currentSubmenu === self.submenu) {
                if(!self.menu.keepOpen) {
                    self.menu.close();
                }
                self.menu.currentSubmenu = null;
            }
        }

        this.menuCloseHandler = () => {
            if(self.menu.currentSubmenu === self.submenu) {
                self.menu.currentSubmenu = null;
                self.submenu.close();
            }
        }

        this.setupSubmenuHover();
    }

    get active() {
        return this.html.classList.contains("MenuSystem_MenuItem_Active");
    }

    set active(active) {
        this.builder.setItemActive(this, active);
    }

    /**
     * Trigger the onAction callback of this MenuItem
     * @private
     */
    triggerOnAction() {
        let self = this;

        if(typeof this.onAction === "function") {
            this.onAction(this);
        }

        if(this.submenu != null) {
            this.toggleSubmenu();
        }
    }

    /**
     * Toggles the submenu of this MenuItem, undefined behaviour if this MenuItem is not currently showing in a menu
     * @private
     */
    toggleSubmenu() {
        if(this.submenu == null) {
            throw "Tried to toggle submenu on a menuitem that has no submenu!";
        }

        //Find top component after html
        let parent = this.html;
        while(parent.parentNode != null && !parent.parentNode.matches("html")) {
            parent = parent.parentNode;
        }

        parent.appendChild(this.submenu.html);

        if(this.submenu.isOpen) {
            this.menu.deregisterOnCloseCallback(this.menuCloseHandler);
            this.submenu.deregisterOnCloseCallback(this.submenuCloseHandler);
            this.submenu.close();
            this.submenu.superMenu = null;
            this.menu.currentSubmenu = null;
        } else {
            this.submenu.open(this.html);
            this.submenu.superMenu = this.menu;
            this.menu.currentSubmenu = this.submenu;
            this.submenu.registerOnCloseCallback(this.submenuCloseHandler);
            this.menu.registerOnCloseCallback(this.menuCloseHandler);
        }
    }

    /**
     * Destroys this MenuItem
     */
    destroy() {
        this.builder.destroyMenuItem(this);
    }

    /**
     * @private
     */
    setupSubmenuHover() {
        let self = this;

        let submenuHoverTimerId = null;

        this.html.addEventListener("mouseenter", (evt)=>{
            //Close all other submenus from our Menu
            self.menu.closeAllOtherSubmenus(self);

            if(this.submenuOnHover && this.submenu != null && !this.submenu.isOpen) {
                self.toggleSubmenu();
            }
        });

        this.html.addEventListener("mouseleave", (evt)=>{
            let newTarget = document.elementFromPoint(evt.pageX, evt.pageY);

            let menuItemRect = self.html.getBoundingClientRect();
            let submenuRect = null;

            if(this.submenu?.html != null) {
                submenuRect = self.submenu.html.getBoundingClientRect();

                let boxBetween = {
                    xMin: menuItemRect.x+menuItemRect.width - 5,
                    xMax: submenuRect.x + 5,
                    yMin: Math.min(submenuRect.y-5, menuItemRect.y - 5),
                    yMax: Math.max(submenuRect.y+submenuRect.height + 5, menuItemRect.y+menuItemRect.height + 5)
                }

                if(evt.pageX > boxBetween.xMin && evt.pageX < boxBetween.xMax && evt.pageY < boxBetween.yMax && evt.pageY > boxBetween.yMin) {
                    return;
                }
            }

            if(self.submenuOnHover && self.submenu != null && self.submenu.isOpen && !WebstrateComponents.Tools.isInsideElement(self.submenu.html, newTarget)) {
                self.toggleSubmenu();
            }
        });
    }
};
