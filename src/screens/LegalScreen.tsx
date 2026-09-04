import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { SiteFooter } from "../components/SiteFooter";

const UPDATED_AT = "September 4, 2026";

function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionElement = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = descriptionElement?.content;

    document.title = title;
    if (descriptionElement) descriptionElement.content = description;

    return () => {
      document.title = previousTitle;
      if (descriptionElement && previousDescription)
        descriptionElement.content = previousDescription;
    };
  }, [description, title]);
}

function LegalShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell legal-shell">
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Pixel home">
          <img src="/pixel.svg" alt="" /> Pixel
        </Link>
      </header>
      <main className="page-shell legal-page">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PrivacyScreen() {
  usePageMetadata(
    "Privacy Policy · Pixel",
    "How Pixel collects, uses, and protects personal information.",
  );

  return (
    <LegalShell>
      <article>
        <p className="eyebrow">legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated {UPDATED_AT}</p>

        <p className="legal-lead">
          Pixel is a place to publish pixel art and keep a record of creative practice. This policy
          explains what information the service processes and why.
        </p>

        <section>
          <h2>Information we process</h2>
          <p>
            When you sign in, our authentication provider processes account details supplied by
            Google or GitHub, including your name, email address, profile image, and provider
            account identifier. We also process the profile information you add to Pixel, such as
            your username, display name, biography, website, and avatar.
          </p>
          <p>
            When you publish work, we process the image, title, description, visibility setting, and
            creation date you provide. Our infrastructure providers may also process standard
            technical data such as IP addresses, browser information, request logs, and security
            events.
          </p>
        </section>

        <section>
          <h2>How we use information</h2>
          <p>
            We use this information to authenticate you, operate your account, store and display
            your work, provide public profiles and the community feed, prevent abuse, diagnose
            problems, and maintain the security and reliability of the service. We do not sell
            personal information or use it for targeted advertising.
          </p>
        </section>

        <section>
          <h2>Service providers</h2>
          <p>
            Pixel uses Clerk for authentication, Convex for application data, Cloudflare R2 for
            image storage, and Vercel for hosting and delivery. Google and GitHub process data when
            you choose their sign-in option. These providers process information under their own
            terms and privacy policies and may process it in countries other than your own.
          </p>
        </section>

        <section>
          <h2>Public content</h2>
          <p>
            Public profiles and work marked public can be viewed by anyone and may be indexed by
            search engines. Do not publish personal information or content you do not want to make
            public. Private work is only made available through authenticated, authorized requests.
          </p>
        </section>

        <section>
          <h2>Retention and deletion</h2>
          <p>
            We keep account and content data while your account is active. You can remove your work
            or delete your account from the application. Some records may remain temporarily in
            backups or security logs where reasonably necessary for recovery, fraud prevention, or
            legal compliance.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <p>
            You can review and update your profile, change a work's visibility, remove uploaded
            work, or delete your account. Depending on where you live, you may also have rights to
            access, correct, export, restrict, or object to the processing of your personal data.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p>
            Pixel is not directed to children under 13, and we do not knowingly collect personal
            information from children under 13.
          </p>
        </section>

        <section>
          <h2>Contact and changes</h2>
          <p>
            Questions or privacy requests can be sent to{" "}
            <a href="mailto:hello@imprfct.dev">hello@imprfct.dev</a>. We may update this policy as
            the service changes. The date above identifies the latest version.
          </p>
        </section>
      </article>
    </LegalShell>
  );
}

export function TermsScreen() {
  usePageMetadata("Terms of Service · Pixel", "Terms governing use of the Pixel service.");

  return (
    <LegalShell>
      <article>
        <p className="eyebrow">legal</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated {UPDATED_AT}</p>

        <p className="legal-lead">
          These terms govern your use of Pixel. By creating an account or using the service, you
          agree to them.
        </p>

        <section>
          <h2>Your account</h2>
          <p>
            You are responsible for your account activity and for keeping access to your Google or
            GitHub account secure. Information you provide must be accurate and must not impersonate
            another person or organization.
          </p>
        </section>

        <section>
          <h2>Your content</h2>
          <p>
            You keep ownership of the work you upload. You grant Pixel a limited, worldwide license
            to store, process, resize, and display that content only as needed to operate and
            promote the service. You can end this license by removing the content, subject to
            reasonable backup and caching periods.
          </p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p>
            Do not upload unlawful, infringing, deceptive, malicious, or abusive content; interfere
            with the service; attempt unauthorized access; scrape the service in a way that harms
            its operation; or use Pixel to violate another person's rights.
          </p>
        </section>

        <section>
          <h2>Service availability</h2>
          <p>
            Pixel is provided on an as-available basis. Features may change, pause, or end, and we
            do not guarantee uninterrupted operation or permanent storage. Keep your own copies of
            important work.
          </p>
        </section>

        <section>
          <h2>Third-party services</h2>
          <p>
            Authentication, hosting, data storage, and delivery rely on third-party providers. Your
            use of Google, GitHub, Clerk, Convex, Cloudflare, and Vercel may also be governed by
            their terms.
          </p>
        </section>

        <section>
          <h2>Enforcement and termination</h2>
          <p>
            We may remove content or suspend access when reasonably necessary to protect users,
            comply with law, or enforce these terms. You may stop using Pixel and delete your
            account at any time.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p>
            To the extent permitted by law, Pixel and its maintainer are not liable for indirect,
            incidental, special, consequential, or exemplary damages, or for lost content, profits,
            or data arising from use of the service.
          </p>
        </section>

        <section>
          <h2>Contact and changes</h2>
          <p>
            Questions can be sent to <a href="mailto:hello@imprfct.dev">hello@imprfct.dev</a>. We
            may update these terms as the service changes. Continued use after an update means you
            accept the revised terms.
          </p>
        </section>
      </article>
    </LegalShell>
  );
}
