# CmsConsentBanner
A cookie banner with full or partial acceptance of consents and callback of the choices to use with Google Tag Manager and Google Consent.

This can be a good starting point for anyone who need a solution like and to be implementable, virutally, to any CMS.
Made from a developer to other developers.
Please feel free to improve this project.

# NO DEPENDENCIES - Vanilla JS

# WHY
I made this simple object to handle some specific needs of some customers.
In details we need a Cookie Consent Banner that allow the user to accept all or accept partially consents.
After that, we need to send that consents preference to Google Consent. (this is where the callback comes into play)

The banner works with 3 types of consents:
- necessary             (cookie session used by website to "work")
- ad_storage            (cookie to collect stats about usage of website)
- analytics_storage     (cookie for marketing and adv)

# HOW TO USE
- Include the Javascript and the CSS files
- Create a <div> in your html page that will be the main banner container. Example: <div id="my-awesome-cookiebanner"></div>
- Set or customize your values (for example you can simply override the translations values by accessing the object directly or via DOM data api
- Call the init method passing in your div ID. CmsConsentBanner.init('my-awesome-cookiebanner')

@see some details inside the javascript file in the comments
  
 
# SEND USER CONSENTS VIA GOOGLE CONSENT API
Implement your custom callback function and set to the Object.

For example we define our custom callback like:

function OnUserHasMadeSomeChoiceCallback( userChoices ) {      do something with userChoices, for example send to google consent. }

Set the object to use your callback in 2 ways:
  - via DOM data api:   <div id="..."  data-callback="OnUserHasMadeSomeChoiceCallback" ...>
  - via js method CmsConsentBanner.setUserChoiceCallback( )

  
Note: userChoices pass value 1 for accept and 0 for not accept.

Google need these values as "granted" or "denied".
    gtag('consent', 'update', {
            ad_storage: 'granted',
            analytics_storage: 'denied'
    });
  
see more informations here:
https://developers.google.com/tag-platform/devguides/consent#tag-manager_1


  
  
