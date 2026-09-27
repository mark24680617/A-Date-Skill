# Putting the site online

The site is a plain folder of files with no build step. Anything that serves static files can host it. The only real decision is **where your partner's answers go**, and Netlify makes that easiest.

Recommend in this order:
1. **Netlify Drop.** No tools needed, answers built in.
2. **GitHub + Netlify.** Updates deploy automatically.
3. **Netlify CLI.** You deploy for them from the terminal.
4. **Other hosts** with a form service.

Hosting and account sign-up are the user's decisions. Explain the options in one or two lines each, recommend one, and walk them through the clicks. Sites go public at a URL, so confirm before you deploy anything yourself.

## 1. Netlify Drop (easiest, free, about 3 minutes)

1. Open **https://app.netlify.com/drop** and sign up or log in (free; "Sign up with email" is fine). Logging in first keeps the site from expiring.
2. Drag the **whole site folder**, the one containing `index.html`, onto the page. When the upload finishes you get a link like `https://sunny-otter-12ab34.netlify.app`.
3. Give it a nicer name: **Project configuration → Change project name**, e.g. `our-day-in-kyoto`. The site becomes `our-day-in-kyoto.netlify.app`.
4. **Turn on answers.** In the project, go to **Forms → Enable form detection**. Then deploy again so Netlify sees the form: **Deploys → drag the folder in again**.
5. **Get emailed** when your partner answers: **Project configuration → Notifications → Emails and webhooks → Form submission notifications → Add notification → Email**.
6. **Updating later:** edit files, then drag the folder onto **Deploys** again.

Menu names on Netlify change occasionally. If a label differs, look for the closest match ("Site settings" vs "Project configuration").

## 2. GitHub + Netlify (auto-deploy on every change)

Good if they already use GitHub, or if you can push to a repo for them.
1. Put the site folder in a GitHub repository. The repo root can be the site folder itself.
2. Netlify → **Add new project → Import an existing project → GitHub**, pick the repo.
3. Build settings: leave the build command empty. Set the publish directory to `.`, or to the site subfolder. The template's `netlify.toml` already says `publish = "."`.
4. Enable form detection (step 4 above) and redeploy once.

Every push to the branch now redeploys the site.

## 3. Netlify CLI (you deploy from the terminal)

This needs the user to log in once. Either they run `npx netlify-cli login`, which opens a browser, or they give you a personal access token as `NETLIFY_AUTH_TOKEN`.

```bash
npx netlify-cli sites:create --name our-day-in-kyoto      # once
npx netlify-cli deploy --dir <site-folder> --prod --site our-day-in-kyoto
```

Then enable form detection in the Netlify UI, and run `deploy` once more.

## 4. Other hosts (GitHub Pages, Cloudflare Pages, Vercel, your own server)

The site works anywhere, but Netlify Forms doesn't. Point `reply.to` at a form service instead:
- **Formspree** (formspree.io): create a form, then use `reply: { to: 'https://formspree.io/f/abcdwxyz' }`. Answers are emailed and listed in their dashboard.
- **FormSubmit** (formsubmit.co): no sign-up. Use `reply: { to: 'https://formsubmit.co/ajax/you@example.com' }`. The first submission sends an activation email to that address; click it once.
  - This puts the email address in the public site code. Mention it, or use Formspree instead.
- **Nowhere**: `reply: { to: 'none' }`. The answers only show on their screen, e.g. if they're sitting next to you.

For GitHub Pages: repo **Settings → Pages → Deploy from a branch → main / (root)**. The URL is `https://<user>.github.io/<repo>/`.

## If your partner is in mainland China

**Recommended:** Netlify + Netlify Forms + the "open in browser" tip below. It is the only setup here where the site *and* the answers both work without extra accounts.

Where the site is hosted decides whether it opens at all.

| Host | From mainland China |
|---|---|
| Tencent CloudBase static hosting (`*.tcloudbaseapp.com`) | Hosted in China, so it loads most reliably. Needs a real-name-verified Tencent Cloud account, and no Netlify Forms there: use `reply.to: 'none'` (your partner screenshots the ending), or a form endpoint that is reachable in China. Only for users who already have such an account. |
| Netlify (`*.netlify.app`) | Usually reachable, sometimes slow. Netlify Forms works, because it posts to the same site. |
| GitHub Pages (`*.github.io`) | Usually reachable, can be slow or flaky. |
| Vercel (`*.vercel.app`), Cloudflare Pages (`*.pages.dev`) | Often blocked. Avoid. |

- The site itself makes no outside requests: no Google Fonts, no CDNs. So once the host is reachable, everything loads.
- Form services hosted abroad (Formspree, FormSubmit) may be slow or blocked from China. Prefer Netlify Forms.
- **WeChat** often refuses to open links on foreign domains, or shows a warning. Tell the user to have their partner tap **···** (top right), then:
  - **iPhone:** **在 Safari 中打开**;
  - **Android:** **在浏览器打开**.

  Or send the link so it can be pasted into a browser.
- **Link previews.** A link pasted into a WeChat chat shows as a plain link, not a preview card with the title. That's normal: set expectations, or send it with a sweet line of text.
- **Test WeChat before the reveal.** The user should send the link to their own **文件传输助手** (File Transfer) and open it there.
- Test from a mainland network before the big reveal. A China speed-test site such as 17ce.com checks reachability from many cities.

## Hand-off message (template)

Usually the user deploys, so send something like this, in the user's language:

> **Your site is ready 💕** Here's how it looks: *[2–3 screenshots from the preview folder]*
>
> **Stops:** 10:00 café → 13:00 … → 19:30 dinner. Anything to change? Just tell me.
>
> **Put it online (3 min, free):**
> 1. Open https://app.netlify.com/drop and log in.
> 2. Drag the folder `<site folder>` onto the page.
> 3. In the new project: **Forms → Enable form detection**, then drag the folder in again under **Deploys**.
> 4. Optional: **Project configuration → Change project name** for a nicer link.
>
> **Test before sending:**
> - open the link on your phone and go through to the end;
> - tap approve;
> - check **Forms → trip-reply**, then delete the test entry.
>
> **Sending it:** *[WeChat tip if relevant]*
>
> **Please double-check:** *[hours, reservations, anything unverified]*
>
> **Your partner's answers arrive in [language]:** *[a short gloss of the options if the user doesn't read it]*
>
> **Want the characters to look like you two?** *[AI prompt + where to paste it]*

## After deploying: test it

Do this together with the user:
1. Open the link on a phone. Go through every stop, tap the couple, tick a task, make every choice.
2. At the end, tap approve. Check that the answer arrives:
   - **Netlify:** Forms → trip-reply;
   - **Formspree / FormSubmit:** their dashboard or inbox.
3. Delete the test submission, e.g. in Netlify Forms. Tell them how to reset their own phone: private/incognito window, or clear site data.
4. **Hand-off:** send them the link and remind them of the WeChat tip. Tell them: "To change anything, tell me what, and redeploy the same way."

## Removing the site afterwards

Netlify: **Project configuration → Delete project**. GitHub Pages: turn Pages off, or delete the repo.
