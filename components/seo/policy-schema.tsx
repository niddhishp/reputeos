/**
 * JSON-LD structured data for policy pages.
 * Helps Google understand page type and organisation info.
 */

interface PolicySchemaProps {
  type: 'PrivacyPolicy' | 'TermsOfService';
  name: string;
  url: string;
  dateModified: string;
}

export function PolicySchema({ type, name, url, dateModified }: PolicySchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    url,
    dateModified,
    publisher: {
      '@type': 'Organization',
      name: 'ReputeOS',
      url: 'https://reputeos.com',
      legalName: 'Lightseekers Media Private Limited',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'privacy@reputeos.com',
        contactType: 'Privacy Officer',
        areaServed: 'IN',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationPolicySchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ReputeOS',
    url: 'https://reputeos.com',
    legalName: 'Lightseekers Media Private Limited',
    foundingLocation: 'Mumbai, Maharashtra, India',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'hello@reputeos.com',
        contactType: 'Customer Support',
      },
      {
        '@type': 'ContactPoint',
        email: 'privacy@reputeos.com',
        contactType: 'Privacy Officer',
      },
      {
        '@type': 'ContactPoint',
        email: 'billing@reputeos.com',
        contactType: 'Billing',
      },
    ],
    hasCredential: [
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'DPDP Act 2023 Compliant',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
