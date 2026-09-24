---
sidebar_position: 3
title: Analytics and Russian data law (152-FZ)
description: Who is responsible for visitor data when Yandex Metrica or the Google Sheets form export is connected, why you need a cookie banner, what session recording (Webvisor) does and how to turn it on or off.
---

# Analytics and Russian data law (152-FZ)

Metrica and forms collect data about the visitors of **your** site. Under
Russian Federal Law 152-FZ you, the site owner, are the operator of that
data. Layero processes it on your behalf — [see the terms](https://layero.ru/dpa).

What you need to do:

* publish a personal data processing policy on your site;
* add a cookie banner: Metrica sets cookies, and that requires the
  visitor's consent;
* tell visitors about session recording (Webvisor) and about form data
  being sent to Google.

Layero does not add a banner or write a policy for you: the wording and the
way consent is collected depend on what your site does.

## Yandex Metrica

Connect it in the project's **Integrations → Yandex Metrica** section. Once
you sign in with Yandex, Layero:

1. Creates a counter in **your** Metrica account. The statistics live there.
2. Adds the counter code to production-branch builds and starts a rebuild so
   the code shows up on the site right away.
3. Adds the Metrica addresses to your site's Content-Security-Policy, if it
   has one. Otherwise the browser would block the counter.

Apps that render their own HTML (Streamlit, Gradio, Flask, Python and Node
servers) get ready-made counter code to paste into the page template once.

Disconnecting removes the counter code from subsequent builds: it disappears
from the site after the next production-branch build. If your app renders its
own HTML, remove the code from the template yourself. The counter and its
statistics stay in your Metrica account.

## Session recording (Webvisor)

Webvisor records what a visitor does on the page: mouse movements, clicks,
scrolling, form input. The recording later shows how the person used the
site. This is behavioural data about a specific visitor, so only turn
recording on if visitors have been told about it — in the cookie banner and
in your data processing policy.

**Recording is off by default.** Turn it on with the **Session recording
(Webvisor)** switch in the integration window — when connecting or later.

What the switch does:

* changes the "Webvisor, scroll map, form analytics" setting of the counter
  itself in Metrica;
* adds `webvisor:true` to the counter code or removes it;
* opens the `wss://` connection to Metrica in your site's
  Content-Security-Policy (only recording needs it) or closes it;
* starts a rebuild of the production branch so the code on the site changes.

If Metrica rejects the change, the dashboard tells you so. In that case open
the counter settings in Metrica and flip the "Webvisor, scroll map, form
analytics" switch yourself.

If your app renders its own HTML, replace the counter code in the template
after switching — the integration window already shows the updated code.

:::note Counters connected before 25 September 2026
Layero used to turn session recording on for every counter by itself. Those
counters still have recording on. If visitors have not been told about it,
turn it off with the switch in the integration window.
:::

## Form export to Google Sheets

The **Google Sheets** integration receives submissions from the form on your
site and writes each one as a new row to a spreadsheet in your Google Drive.
Everything a visitor types into the form ends up at Google — a company
outside Russia, which makes it a cross-border transfer of personal data.

If the form collects a name, phone number, email or other data about a
person:

* say so next to the form and in your data processing policy;
* collect consent to processing before the form is submitted;
* before the transfers start, notify Roskomnadzor of the cross-border
  transfer (Article 12(3) of 152-FZ).
