<#--
  Soykök Ticaret — giriş sayfalarının ortak iskeleti.
  Keycloak'ın klasik template.ftl'inin yaptığı her şeyi yapar (mesajlar, kullanıcı adı göster/değiştir,
  "başka yöntem dene", sosyal giriş, bilgi alanı); yalnızca görünüm bize ait.
  login.ftl, register.ftl ... parent temadan gelir ve bu makroyu çağırır.
-->
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false others...>
<#assign siteUrl = (properties.siteUrl!'/')?remove_ending('/')>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="${(locale.currentLanguageTag)!'tr'}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#18212b">
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" type="image/svg+xml" href="${url.resourcesPath}/img/favicon.svg">
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet">
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet">
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="importmap">
        { "imports": { "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js" } }
    </script>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if (url.ssoLoginInOtherTabsUrl)??>
    <script type="module">
        import { checkCookiesAndSetTimer } from "${url.resourcesPath}/js/authChecker.js";
        checkCookiesAndSetTimer("${url.ssoLoginInOtherTabsUrl?no_esc}");
    </script>
    </#if>
</head>

<body class="sk-body ${bodyClass}">
<a class="sk-skip" href="#kc-content">${msg("skSkip")}</a>

<div class="sk-page">
    <main class="sk-main">
        <div class="sk-topbar">
            <a class="sk-back" href="${siteUrl}/">${msg("skBackToSite")}</a>
            <#if realm.internationalizationEnabled && (locale.supported)?? && locale.supported?size gt 1>
                <nav class="sk-lang" aria-label="${msg("skLanguage")}">
                    <#list locale.supported as l>
                        <#assign tag = (l.languageTag)!(l.label)>
                        <a href="${l.url}" lang="${tag}"<#if tag == ((locale.currentLanguageTag)!'')> aria-current="true"</#if>>${tag?upper_case}</a>
                    </#list>
                </nav>
            </#if>
        </div>

        <div class="sk-panel ${properties.kcFormCardClass!}">
            <a class="sk-logo" href="${siteUrl}/">
                <img src="${url.resourcesPath}/img/logo-dark.svg" alt="Soykök Ticaret" width="216" height="52">
            </a>
            <header class="sk-header">
                <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                    <h1 id="kc-page-title"><#nested "header"></h1>
                <#else>
                    <#nested "show-username">
                    <div id="kc-username" class="sk-username">
                        <span id="kc-attempted-username">${auth.attemptedUsername}</span>
                        <a id="reset-login" href="${url.loginRestartFlowUrl}">${msg("skChangeUser")}</a>
                    </div>
                </#if>
                <#if displayRequiredFields>
                    <p class="sk-required-note"><span class="required">*</span> ${msg("requiredFields")}</p>
                </#if>
            </header>

            <div id="kc-content" tabindex="-1">
                <div id="kc-content-wrapper">
                    <#-- Uygulamanın başlattığı işlemlerde "tamamlamanız gerekiyor" uyarısı gösterilmez -->
                    <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                        <div class="sk-alert sk-alert-${message.type}" role="<#if message.type == 'error'>alert<#else>status</#if>">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </#if>

                    <#nested "form">

                    <#if auth?has_content && auth.showTryAnotherWayLink()>
                        <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                            <input type="hidden" name="tryAnotherWay" value="on">
                            <button type="submit" class="sk-link-button" id="try-another-way">${msg("doTryAnotherWay")}</button>
                        </form>
                    </#if>

                    <#nested "socialProviders">

                    <#if displayInfo>
                        <div id="kc-info" class="sk-info">
                            <div id="kc-info-wrapper">
                                <#nested "info">
                            </div>
                        </div>
                    </#if>
                </div>
            </div>
        </div>

        <footer class="sk-footer">
            <span>© Soykök Ticaret</span>
            <a href="${siteUrl}/kvkk-aydinlatma-metni">${msg("skPrivacy")}</a>
            <a href="${siteUrl}/iletisim">${msg("skHelp")}</a>
        </footer>
    </main>
</div>
</body>
</html>
</#macro>
