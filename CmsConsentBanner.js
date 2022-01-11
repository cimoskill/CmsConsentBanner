/**
 * 
 * A simple object that should create the cookie consent banner and handle the actions.
 * This was created to fullfill some requirements with working with Google Tag Manager and the Google Consent service.
 * 
 * @author Simone Bagnara
 * 
 * 
 * @type type
 */
const CmsConsentBanner = {
    
    /**
     * if the cookie is found means that the user has already made a choice.
     * @type String
     */
    cookieKey: 'cmsconsentbannerset',
    
    /**
     * default expire value in days
     * @type Number
     */
    cookieExpireDays: 365,
    
    /**
     * TRUE to show the little label after accepted the banner.
     * This is usefull to let users to re-open and edit their consents.
     * Set to FALSE to hide completly the banner after the choice.
     * @type Boolean
     */
    isRevokable: true,
    
    /**
     * TRUE to block the page and scroll. FALSE to allow user to scroll.
     * @type type
     */
    wallBlock: true,
    
    /**
     * Default list of consents that we should ask to the user via the setting panel of the banner.
     * The key and consetn_name is the same value used as cookie value to store the user preference.
     * We also have some description texts like the Title and the Description.
     * the "editable" flag means that the consent is editable from the user.
     * (We use editable:false only for the technical/necessary cookie to let the website to work.)
     * 
     * We can also populate the array "details" foreach consent to describe a table with all the specific cookie, type, description and duration.
     * You can add a single cookie description for a single consent via the method: addConsentDetailEntry.
     *      {name, description, type, duration }
     * 
     * @type type
     */
    consents: {
        
        necessary: {
            consent_name: 'functionality_storage',
            title: 'Necessary',
            description: 'These cookies are necessary for the normal operation of the website. No personally identifiable information is collected.',
            details: [],
            editable: false
        },
        
        ad_storage: {
            consent_name: 'ad_storage',
            title: 'Statistics',
            description: 'These cookies are used to anonymously collect data about usage of the website. No personally identifiable information is collected.',
            details: [],
            editable: true
        },
        
        analytics_storage: {
            consent_name: 'analytics_storage',
            title: 'Marketing',
            description: 'These cookies are used to store marketing and website preferences. No personally identifiable information is collected.',
            details: [],
            editable: true
        }
    },
    
    
    
    /**
     * 
     * Add a single cookie description to a specific consent
     * 
     * @param {type} consentName
     * @param {type} cookieName
     * @param {type} cookieDesc
     * @param {type} cookieDuration
     * @param {string} cookieType (http, local)
     * @returns {undefined}
     */
    addConsentDetailEntry: function( consentName, cookieName, cookieDesc, cookieDuration, cookieType ) {
        
        this.consents[ consentName ].details.push({
            name: cookieName,
            desc: cookieDesc,
            type: cookieType,
            duration: cookieDuration
        });
        
    },
    
    
    
    
    /**
     * DOMElement - the MAIN DIV container
     * sorry for the $ symbol, this object was written in jquery before.
     * @type type
     */
    $el: null,
    
    
    /**
     * internal utils used to manage cookie stuff
     * @type type
     */
    utils: {
        
        setCookie: function(key, value, expiry) {
            const date = new Date();
            date.setTime(date.getTime() + (expiry * 24 * 60 * 60 * 1000));
            var expires = "expires="+date.toUTCString();
            document.cookie = key + "=" + value + ";" + expires + ";path=/";
        },
        
        getCookie: function(key) {
            let name = key + "=";
            let spli = document.cookie.split(';');
            for(var j = 0; j < spli.length; j++) {
              let char = spli[j];
              while (char.charAt(0) == ' ') {
                char = char.substring(1);
              }
              if (char.indexOf(name) == 0) {
                return char.substring(name.length, char.length);
              }
            }
            return "";
        },
        
        clearCookie: function(key) {
            let expiry = 1;
            let value = '';
            const date = new Date();
            date.setTime(date.getTime() + (expiry * 24 * 60 * 60 * 1000));
            let expires = "expires="+date.toUTCString();
            document.cookie = key + "=" + value + ";" + expires + ";path=/";
        }
        
    },
    
    
    /**
     * Some translatable text.
     * You can set these values also via the DOM api "data-attribute"
     * @see init() method for details of the mapping.
     * 
     * @type type
     */
    texts: {
        message: 'Navigando in questo sito si acconsente all\'utilizzo dei cookie ',
        readmoreText: 'Leggi di più',
        readmoreLink: '/privacy.html',
        btnOK: 'Accetta tutto',
        btnOKSelected: 'Accetta selezionati',
        btnSettings: 'Impostazioni',
        btnExpand: 'Dettagli',
        btnRevokable: 'Cookie Policy',
        
        detailsTable: {
            name: 'Name',
            description: 'Description',
            type: 'Type',
            duration: 'Duration'
        }
    },
    
    /**
     * some default class used for some elements.
     * @type type
     */
    styles: {
        bannerShowOpen: 'with-cmsconsentbanner-open',
        bannerShowClosed: 'with-cmsconsentbanner-closed',
            bannerShowWallblock: 'with-cmsconsentbanner-wallblock',
        
        btnClass: 'btn', // added to every button always
        btnOkClass: 'btn-primary', // added to specific buttons only
        btnOKSelectedClass: 'btn-secondary', // added to specific buttons only
        btnSettingsClass: 'btn-secondary' // added to specific buttons only
    },
    
    
    /**
     * callback function if set
     * @type type|Window
     */
    __onUserChoiceCallback: null,
    
    /**
     * callback function if set
     * @type type|Window
     */
    __preventActivationCallback: null,
    
    
    /**
     * Set your custom callback called after the user made the choice.
     * The callback function accepts 1 argument Object that contains, as key value, the consent and the value.
     * Esample:
     * 
     * {
     *      necessary: 1,
     *      ad_storage: 0,
     *      analytics_storage: 1
     * }
     * 
     * You can set this callback also via "data-callback" DOM attribute
     * 
     * @param {type} callback
     * @returns {undefined}
     */
    setUserChoiceCallback: function( callback ) {
        
        if ( typeof callback !== 'function' ) {
            console.error('setUserChoiceCallback must be a function!');
            return;
        }
        
        this.__onUserChoiceCallback = callback;
    },
    
    
    /**
     * This callback allow you to choose IF the banner should stay inactive.
     * This method MUST return TRUE or FALSE.
     * default: FALSE the banner is not preventded to open.
     * TRUE to prevent the banner to open.
     * 
     * @param {type} callback
     * @returns {bool}
     */
    setPreventActivationCallback: function( callback ) {
        if ( typeof callback !== 'function' ) {
            console.error('setPreventActivationCallback must be a function!');
            return;
        }
        
        this.__preventActivationCallback = callback;
    },
    
    
    
    
    
    /**
     * 
     * Initialize the object and stuff.
     * Pass in "selectorId" (string) as the ID of your main <div> of the banner that should be inserted in the DOM before calling this method.
     * 
     * @param {type} selectorId
     * @returns {Boolean}
     */
    init: function(selectorId) {
        
        this.$el = document.getElementById(selectorId);
        this.$el.classList.add('cmsconsentbanner-main');
        
        if ( this.isRevokable ) {
            this.$el.classList.add('revokable');
        }
        
        /**
         * DOM API data-
         */
        let d = this.$el.dataset;
        if ( typeof d !== 'undefined' ) {
            if ( d.hasOwnProperty('message') ) {
                this.texts.message = d.message;
            }
            if ( d.hasOwnProperty('ok') ) {
                this.texts.btnOK = d.ok;
            }
            if ( d.hasOwnProperty('okpartial') ) {
                this.texts.btnOKSelected = d.okpartial;
            }
            if ( d.hasOwnProperty('settings') ) {
                this.texts.btnSettings = d.settings;
            }
            if ( d.hasOwnProperty('more') ) {
                this.texts.readmoreText = d.more;
            }
            if ( d.hasOwnProperty('morelink') ) {
                this.texts.readmoreLink = d.morelink;
            }
            if ( d.hasOwnProperty('lblrevokable') ) {
                this.texts.btnRevokable = d.lblrevokable;
            }
            
            // Set callback on choice via DOM
            if ( d.hasOwnProperty('callback') && typeof window[d.callback] === 'function' ) {
                this.__onUserChoiceCallback = window[d.callback];
            }
            
            // Set prevent callback 
            if ( d.hasOwnProperty('prevent') && typeof window[d.prevent] === 'function' ) {
                this.__preventActivationCallback = window[d.prevent];
            }
        }
        
        
        
        if ( typeof this.__preventActivationCallback === 'function' ) {
            let bool = this.__preventActivationCallback();
            if ( bool === true ) {
                // prevent to activate
                return false;
            }
        }
        
        
        
        
        // prepare inner layout
        this.prepareLayout();
        
        
        
        /**
         * 
         * @type Stringcheck for user choice cookie stored.
         * If yes the banner should stay closed.
         */
        let val = this.utils.getCookie( this.cookieKey );
        if ( val === '' ) {
            this.showConsentBanner();
        } else {
            this.showConsentBannerClosed();
        }
        
    },
    
    
    
    /**
     * this methods fills the main DIV of the banner with all the layout and elements.
     * 
     * enjoy
     * 
     * @returns {undefined}
     */
    prepareLayout: function() {
        
        let $this = this;
        
        // inner DIV
        const innerDIV = document.createElement('div');
        innerDIV.classList.add('consentbanner-inner');
        
        // DIV for the label revokable
        const revokableDIV = document.createElement('div');
        revokableDIV.classList.add('revokable-lbl');
        const revokableAnchor = document.createElement('a');
        revokableAnchor.setAttribute('href', '#');
        revokableAnchor.innerHTML = $this.texts.btnRevokable;
        revokableAnchor.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $this.showConsentBanner();
        });
        
        revokableDIV.appendChild(revokableAnchor);
        
        innerDIV.appendChild(revokableDIV);
        
        
        // # DIV with primary message and buttons
        const priDIV = document.createElement('div');
        priDIV.classList.add('consentbanner-primary');
        const priMessageDIV = document.createElement('div');
        priMessageDIV.classList.add('cb-message');
            const priMessageInnerSpan = document.createElement('span');
            priMessageInnerSpan.innerHTML = $this.texts.message;
            
        // <a href="">read more</a>
        priMessageDIV.appendChild(priMessageInnerSpan);
        const readmoreAnchor = document.createElement('a');
        readmoreAnchor.setAttribute('href', $this.texts.readmoreLink);
        readmoreAnchor.setAttribute('target', '_blank');
        readmoreAnchor.innerHTML = $this.texts.readmoreText;
        
        priMessageDIV.appendChild(readmoreAnchor);
        
        priDIV.appendChild(priMessageDIV);
        
        // buttons area
        let priBtnContainer = document.createElement('div');
        priBtnContainer.classList.add('cb-buttons-container');
            let priButtons = document.createElement('div');
            priButtons.classList.add('cb-buttons');
            
            const btnAcceptAll = document.createElement('button');
            btnAcceptAll.classList.add($this.styles.btnClass);
            btnAcceptAll.classList.add($this.styles.btnOkClass);
            btnAcceptAll.classList.add('cb-button-accept-all');
            btnAcceptAll.innerHTML = $this.texts.btnOK;
            btnAcceptAll.addEventListener('click', function(e) {
                e.preventDefault();
                $this.onAcceptAll();
            });
            
            const btnSettings = document.createElement('button');
            btnSettings.classList.add($this.styles.btnClass);
            btnSettings.classList.add($this.styles.btnSettingsClass);
            btnSettings.classList.add('cb-button-settings');
            btnSettings.innerHTML = $this.texts.btnSettings;
            btnSettings.addEventListener('click', function(e) {
                e.preventDefault();
                $this.onSettings();
            });
            
            priButtons.appendChild(btnAcceptAll);
            priButtons.appendChild(btnSettings);
        priBtnContainer.appendChild(priButtons);
        
        priDIV.appendChild(priBtnContainer);
        
        
        // # DIV settings panel
        const settingsDIV = document.createElement('div');
        settingsDIV.classList.add('consentbanner-settings');
        
        const flagsDIV = document.createElement('div');
        flagsDIV.classList.add('cb-consent-infos-box');
        
            const flagsInnerLeftUL = document.createElement('ul');
            
            const flagsInnerRightDIV = document.createElement('div');
            
            
            let index = 0;
            for(let k in this.consents) {
                let c = this.consents[k];
                
                let entryA = document.createElement('a');
                entryA.setAttribute('href', '#');
                entryA.innerHTML = c.title;
                entryA.addEventListener('click', function(e){
                    e.preventDefault();
                    $this.openSettingsPanel( this );
                });
                
                let entryLI = document.createElement('li');
                entryLI.setAttribute('data-id', c.consent_name);
                if ( index === 0 ) {
                    entryLI.classList.add('active');
                }
                entryLI.appendChild(entryA);
                flagsInnerLeftUL.appendChild(entryLI);
                
                
                let entryPanel = document.createElement('div');
                entryPanel.classList.add('cb-consent-single-desc');
                entryPanel.setAttribute('data-id', c.consent_name);
                
                    let entryPanelTitle = document.createElement('div');
                    entryPanelTitle.classList.add('cb-consent-title');
                    entryPanelTitle.innerHTML = c.title;
                    
                    let entryPanelDesc = document.createElement('div');
                    entryPanelDesc.classList.add('cb-consent-desc');
                    entryPanelDesc.innerHTML = c.description;
                    
                    let entryPanelDetail = document.createElement('div');
                    entryPanelDetail.classList.add('cb-consent-details');
                    if ( c.details.length === 0 ) {
                        entryPanelDetail.classList.add('empty');
                    } else {
                        //...
                        // button expand + inner table list
                        //
                        
                        let btnExpand = document.createElement('a');
                        btnExpand.classList.add('cb-button-expand-details');
                        btnExpand.setAttribute('href', '#');
                        btnExpand.innerHTML = $this.texts.btnExpand;
                        btnExpand.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            if ( this.parentNode.classList.contains('expanded') ) {
                                this.parentNode.classList.remove('expanded');
                            } else {
                                this.parentNode.classList.add('expanded');
                            }
                        });
                        
                        entryPanelDetail.appendChild(btnExpand);
                        
                        // details table
                        let detailsTable = document.createElement('table');
                        detailsTable.classList.add('table');
                        
                        // thead - tr - th
                        let detailsTableTHEAD = document.createElement('thead');
                        let detailsTableTHEAD_TR = document.createElement('tr');
                            let th1 = document.createElement('th');
                            th1.append($this.texts.detailsTable.name);
                            let th2 = document.createElement('th');
                            th2.append($this.texts.detailsTable.description);
                            let th3 = document.createElement('th');
                            th3.append($this.texts.detailsTable.type);
                            let th4 = document.createElement('th');
                            th4.append($this.texts.detailsTable.duration);
                        detailsTableTHEAD_TR.appendChild(th1);
                        detailsTableTHEAD_TR.appendChild(th2);
                        detailsTableTHEAD_TR.appendChild(th3);
                        detailsTableTHEAD_TR.appendChild(th4);
                        detailsTableTHEAD.appendChild(detailsTableTHEAD_TR);
                        
                        // tbody tr td
                        let detailsTableTBODY = document.createElement('tbody');
                        for(let i in c.details) {
                            let detail = c.details[i];
                            
                            let entryTR = document.createElement('tr');
                            for(let attr in detail) {
                                let entryColumnTD = document.createElement('td');
                                entryColumnTD.append(detail[attr]);
                                
                                entryTR.appendChild(entryColumnTD);
                            }
                            
                            detailsTableTBODY.appendChild(entryTR);
                            
                        }
                        
                        detailsTable.appendChild(detailsTableTHEAD);
                        detailsTable.appendChild(detailsTableTBODY);
                        
                        
                        let detailTableContainer = document.createElement('div');
                        detailTableContainer.classList.add('details-contents');
                        detailTableContainer.appendChild(detailsTable);
                        
                        
                        entryPanelDetail.appendChild(detailTableContainer);
                        
                    }
                    
                entryPanel.appendChild(entryPanelTitle);
                entryPanel.appendChild(entryPanelDesc);
                entryPanel.appendChild(entryPanelDetail);
                
                flagsInnerRightDIV.appendChild(entryPanel);
                
                
                
                index++;
            }// each consent
            
            
            
        flagsDIV.appendChild(flagsInnerLeftUL);
        flagsDIV.appendChild(flagsInnerRightDIV);
        
        settingsDIV.appendChild(flagsDIV);
        
        
        const settingsBtnContainer = document.createElement('div');
        settingsBtnContainer.classList.add('cb-buttons-container');
        
            const settButtons = document.createElement('div');
            settButtons.classList.add('cb-buttons');
        
            const btnSettingsAcceptAll = document.createElement('button');
            btnSettingsAcceptAll.classList.add($this.styles.btnClass);
            btnSettingsAcceptAll.classList.add($this.styles.btnOkClass);
            btnSettingsAcceptAll.innerHTML = $this.texts.btnOK;
            btnSettingsAcceptAll.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $this.onAcceptAll();
            });
        
            const btnSettingsAcceptSelected = document.createElement('button');
            btnSettingsAcceptSelected.classList.add($this.styles.btnClass);
            btnSettingsAcceptSelected.classList.add($this.styles.btnOKSelectedClass);
            btnSettingsAcceptSelected.innerHTML = $this.texts.btnOKSelected;
            btnSettingsAcceptSelected.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $this.onAcceptSelected();
            });
            
            // ...
            
            
            settButtons.appendChild(btnSettingsAcceptSelected);
            settButtons.appendChild(btnSettingsAcceptAll);
        settingsBtnContainer.appendChild(settButtons);
        
        settingsDIV.appendChild(settingsBtnContainer);
        
        // other stuff checkbox ....
        const consentFlags = document.createElement('div');
        consentFlags.classList.add('cb-consent-flags');
        
        // Flag per i consensi
        for(let k in this.consents) {
            let c = this.consents[k];
            
            let lbl =  document.createElement('label');
            let inputCheckbox = document.createElement('input');
            inputCheckbox.setAttribute('type', 'checkbox');
            inputCheckbox.setAttribute('name', c.consent_name);
            inputCheckbox.classList.add('cb-consent');
            // flag modificabile
            if ( c.editable ) {
                // Se il flag è modificabile allora controllo se ho già un valore nei cookie precedentemente impostato.
                let flagValue = $this.utils.getCookie( c.consent_name );
                if ( flagValue !== '' ) {
                    inputCheckbox.checked = true;
                }
                
            } else {
                // flag non modificabile quindi flaggato e bloccato. (cookie necessari)
                inputCheckbox.checked = true;
                inputCheckbox.disabled = true;
            }
            
            
            lbl.appendChild(inputCheckbox);
            lbl.append(c.title);
            
            
            
            consentFlags.appendChild(lbl);
                
        }
        
        settingsDIV.appendChild(consentFlags);
        
        
        
        
        
        
        // finally
        innerDIV.appendChild(priDIV);
        innerDIV.appendChild(settingsDIV);
        
        
        $this.$el.append(innerDIV);
        
        
    },
    
    
    
    /**
     * This method should open the banner to allow the user to interact
     * @returns {undefined}
     */
    showConsentBanner: function() {
        
        document.body.classList.remove(this.styles.bannerShowClosed);
        document.body.classList.add(this.styles.bannerShowOpen);
        
        if ( this.wallBlock ) {
            document.body.classList.add( this.styles.bannerShowWallblock );
        }
        
        this.$el.querySelector('.consentbanner-primary').style.display = 'block';
        this.$el.querySelector('.revokable-lbl').style.display = 'none';
    },
    
    
    /**
     * This method should close the banner because the user has made the choice.
     * This is where we handle the "isRevokable" option witch should show the little clickable label to reopen it (if TRUE).
     * If FALSE the banner can disappear. This is handled via CSS
     * 
     * @returns {undefined}
     */
    showConsentBannerClosed: function() {
        
        document.body.classList.remove(this.styles.bannerShowOpen);
        document.body.classList.add(this.styles.bannerShowClosed);
        
        this.$el.querySelector('.consentbanner-settings').style.display = 'none';
        this.$el.querySelector('.consentbanner-primary').style.display = 'none';
        
        if ( this.isRevokable ) {
            this.$el.querySelector('.revokable-lbl').style.display = 'block';
        } else {
            this.$el.querySelector('.revokable-lbl').style.display = 'none';
        }
    },
    
    
    /**
     * The user accepts all the consents.
     * We sync the UI state, collect all consent flags and value and create the "userChoices" Object 
     * that is passed to the custom callback function, if defined.
     * 
     * @returns {undefined}
     */
    onAcceptAll: function() {
        
        let $this = this;
        
        // the user has made some choice
        this.utils.setCookie(this.cookieKey, 1, this.cookieExpireDays);
        
        let userChoices = {};
        
        for(let k in this.consents) {
            let c = this.consents[k];
            this.utils.setCookie(c.consent_name, 1, this.cookieExpireDays);
            
            userChoices[ c.consent_name ] = 1;
            
            // UI sync
            $this.$el.querySelector('.cb-consent-flags input[type="checkbox"][name="'+c.consent_name+'"]').checked = true;
        }
        
        this.showConsentBannerClosed();
        
        
        // Callback
        if ( typeof this.__onUserChoiceCallback === 'function' ) {
            
            this.__onUserChoiceCallback(userChoices);
            
        }
    },
    
    
    
    /**
     * User click on Settings button.
     * This method should show the inner panel of settings and hiding the primary inner panel.
     * 
     * @returns {undefined}
     */
    onSettings: function() {
        
        this.$el.querySelector('.consentbanner-primary').style.display = 'none';
        this.$el.querySelector('.consentbanner-settings').style.display = 'block';
        
    },
    
    /**
     * User click, inside the settings panel, on one of the consent voice.
     * This action should expand the inner description panel of the clicked consent with the title, description and if defined the table with cookie details.
     * 
     * @param {type} clickedAnchor
     * @returns {undefined}
     */
    openSettingsPanel: function( clickedAnchor ) {
        
        const parentLI = clickedAnchor.parentNode;
        const parentUL = parentLI.parentNode;
       
        let consentName = parentLI.dataset.id;
        
        const childList = parentUL.children;
        for(let i=0; i < childList.length; i++ ) {
            childList[i].classList.remove('active');
        }
        
        parentLI.classList.add('active');
        
        // hide all desc panels
        const allDescs = this.$el.querySelectorAll('.cb-consent-single-desc');
        for(let i=0; i<allDescs.length; i++) {
            allDescs[i].style.display = 'none';
        }
        
        // show this one
        this.$el.querySelector('.cb-consent-single-desc[data-id="'+consentName+'"]').style.display = 'block';
    },
    
    
    /**
     * User click on Accept selected. collect all consent flags and value and create the "userChoices" Object that is passed to the custom callback function, if defined.
     * @returns {undefined}
     */
    onAcceptSelected: function() {
        
        let acceptedConsents = {};
        let userChoices = {};
        
        // the user has made some choice
        this.utils.setCookie(this.cookieKey, 1, this.cookieExpireDays);
        
        const checkboxList = this.$el.querySelector('.cb-consent-flags input[type="checkbox"]');
        for(let i=0; i<checkboxList.length; i++) {
            if ( checkboxList[i].checked ) {
                let consentName = checkboxList[i].getAttribute('name');
                acceptedConsents[ consentName ] = 1;
            }
        }
        
        
        // cookie dei singoli consensi
        for(let k in this.consents) {
            let c = this.consents[k];
            
            if ( acceptedConsents.hasOwnProperty( c.consent_name ) ) {
                this.utils.setCookie(c.consent_name, 1, this.cookieExpireDays);
                
                userChoices[ c.consent_name ] = 1;
                
            } else {
                this.utils.setCookie(c.consent_name, '', this.cookieExpireDays);
                
                userChoices[ c.consent_name ] = 0;
            }
        }
        
        
        this.showConsentBannerClosed();
        
        
        // Callback
        if ( typeof this.__onUserChoiceCallback === 'function' ) {
            
            this.__onUserChoiceCallback(userChoices);
            
        }
    }
    
};
