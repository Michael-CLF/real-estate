import {
    defineString
} from 'firebase-functions/params';

import {
    onRequest
} from 'firebase-functions/v2/https';

import {
    adminFirestore
} from '../shared/firebase-admin';

import {
    FUNCTION_REGION
} from '../shared/function-options';

const publicSiteOrigin =
    defineString(
        'PUBLIC_SITE_ORIGIN',
        {
            default:
                'https://navstreet.com',

            description:
                'The public NavStreet website origin.'
        }
    );

interface PublicListingData {
    addressLine1?: unknown;
    city?: unknown;
    state?: unknown;
    zipCode?: unknown;
    bedrooms?: unknown;
    bathrooms?: unknown;
    squareFeet?: unknown;
    listPrice?: unknown;
    primaryPhotoUrl?: unknown;
    status?: unknown;
}

export const listingSharePage =
    onRequest(
        {
            region:
                FUNCTION_REGION,

            maxInstances:
                10,

            timeoutSeconds:
                30,

            memory:
                '256MiB'
        },

        async (
            request,
            response
        ) => {
            response.set(
                'Content-Type',
                'text/html; charset=utf-8'
            );

            const shareCode =
                readShareCode(
                    request.path,
                    request.query['shareCode']
                );

            if (!shareCode) {
                response
                    .status(404)
                    .send(
                        createUnavailablePage(
                            publicSiteOrigin.value()
                        )
                    );

                return;
            }

            try {
                const shareCodeSnapshot =
                    await adminFirestore
                        .collection(
                            'listingShareCodes'
                        )
                        .doc(shareCode)
                        .get();

                if (!shareCodeSnapshot.exists) {
                    response
                        .status(404)
                        .send(
                            createUnavailablePage(
                                publicSiteOrigin.value()
                            )
                        );

                    return;
                }

                const shareCodeData =
                    shareCodeSnapshot.data();

                const listingUid =
                    readString(
                        shareCodeData?.['listingUid']
                    );

                const shareLinkActive =
                    shareCodeData?.['active'] ===
                    true;

                if (
                    !listingUid ||
                    !shareLinkActive
                ) {
                    response
                        .status(404)
                        .send(
                            createUnavailablePage(
                                publicSiteOrigin.value()
                            )
                        );

                    return;
                }

                const listingSnapshot =
                    await adminFirestore
                        .collection('listings')
                        .doc(listingUid)
                        .get();

                if (!listingSnapshot.exists) {
                    response
                        .status(404)
                        .send(
                            createUnavailablePage(
                                publicSiteOrigin.value()
                            )
                        );

                    return;
                }

                const listing =
                    listingSnapshot.data() as
                    PublicListingData;

                if (
                    listing.status !==
                    'active'
                ) {
                    response
                        .status(404)
                        .send(
                            createUnavailablePage(
                                publicSiteOrigin.value()
                            )
                        );

                    return;
                }

                const siteOrigin =
                    normalizeOrigin(
                        publicSiteOrigin.value()
                    );

                const listingUrl =
                    `${siteOrigin}/listings/${encodeURIComponent(listingUid)}`;

                const shareUrl =
                    `${siteOrigin}/h/${encodeURIComponent(shareCode)}`;

                const title =
                    createListingTitle(
                        listing
                    );

                const description =
                    createListingDescription(
                        listing
                    );

                const imageUrl =
                    readHttpsUrl(
                        listing.primaryPhotoUrl
                    );

                response.set(
                    'Cache-Control',
                    'public, max-age=300, s-maxage=600'
                );

                response
                    .status(200)
                    .send(
                        createSharePage({
                            title,
                            description,
                            imageUrl,
                            listingUrl,
                            shareUrl
                        })
                    );
            } catch (error: unknown) {
                console.error(
                    'Unable to prepare listing share page:',
                    error
                );

                response
                    .status(500)
                    .send(
                        createUnavailablePage(
                            publicSiteOrigin.value()
                        )
                    );
            }
        }
    );

interface SharePageData {
    title: string;
    description: string;
    imageUrl: string;
    listingUrl: string;
    shareUrl: string;
}

function createSharePage(
    data: SharePageData
): string {
    const title =
        escapeHtml(data.title);

    const listingUrl =
        escapeHtmlAttribute(
            data.listingUrl
        );

    const shareUrl =
        escapeHtmlAttribute(
            data.shareUrl
        );

    const imageMetadata =
        data.imageUrl
            ? `
    <meta
      property="og:image"
      content="${escapeHtmlAttribute(data.imageUrl)}"
    >
    <meta
      property="og:image:alt"
      content="${escapeHtmlAttribute(data.title)}"
    >
    <meta
      name="twitter:image"
      content="${escapeHtmlAttribute(data.imageUrl)}"
    >`
            : '';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <title>${title}</title>

  <meta
    name="description"
    content="${escapeHtmlAttribute(data.description)}"
  >

  <link
    rel="canonical"
    href="${shareUrl}"
  >

  <meta
    property="og:type"
    content="website"
  >

  <meta
    property="og:site_name"
    content="NavStreet"
  >

  <meta
    property="og:title"
    content="${escapeHtmlAttribute(data.title)}"
  >

  <meta
    property="og:description"
    content="${escapeHtmlAttribute(data.description)}"
  >

  <meta
    property="og:url"
    content="${shareUrl}"
  >

  ${imageMetadata}

  <meta
    name="twitter:card"
    content="summary_large_image"
  >

  <meta
    name="twitter:title"
    content="${escapeHtmlAttribute(data.title)}"
  >

  <meta
    name="twitter:description"
    content="${escapeHtmlAttribute(data.description)}"
  >

  <meta
    http-equiv="refresh"
    content="0;url=${listingUrl}"
  >

  <style>
    body {
      margin: 0;
      color: #102e45;
      background: #f4f7f9;
      font-family:
        Arial,
        sans-serif;
    }

    main {
      display: grid;
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
      place-items: center;
    }

    section {
      width: min(100%, 620px);
      padding: 40px 28px;
      border: 1px solid #cfdae3;
      border-radius: 16px;
      box-sizing: border-box;
      text-align: center;
      background: #ffffff;
    }

    h1 {
      margin: 0;
      color: #0d3048;
      font-size: 32px;
    }

    p {
      margin: 14px 0 0;
      color: #5e7486;
      line-height: 1.6;
    }

    a {
      display: inline-flex;
      min-height: 44px;
      padding: 10px 18px;
      border-radius: 8px;
      margin-top: 22px;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      background: #154360;
      font-weight: 700;
      text-decoration: none;
    }
  </style>
</head>

<body>
  <main>
    <section>
      <h1>
        Opening this NavStreet property
      </h1>

      <p>
        If the property does not open automatically,
        use the button below.
      </p>

      <a href="${listingUrl}">
        View property
      </a>
    </section>
  </main>

  <script>
    window.location.replace(
      ${JSON.stringify(data.listingUrl)}
    );
  </script>
</body>
</html>`;
}

function createUnavailablePage(
    origin: string
): string {
    const homesUrl =
        `${normalizeOrigin(origin)}/homes`;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <meta
    name="robots"
    content="noindex"
  >

  <title>
    Listing unavailable | NavStreet
  </title>
</head>

<body>
  <main>
    <h1>
      This property is unavailable
    </h1>

    <p>
      The listing may have been removed or
      may no longer be publicly available.
    </p>

    <a href="${escapeHtmlAttribute(homesUrl)}">
      Browse homes
    </a>
  </main>
</body>
</html>`;
}

function createListingTitle(
    listing: PublicListingData
): string {
    const address =
        [
            readString(
                listing.addressLine1
            ),
            readString(
                listing.city
            ),
            readString(
                listing.state
            )
        ]
            .filter(Boolean)
            .join(', ');

    return address
        ? `${address} | NavStreet`
        : 'Property for sale | NavStreet';
}

function createListingDescription(
    listing: PublicListingData
): string {
    const address =
        [
            readString(
                listing.addressLine1
            ),
            readString(
                listing.city
            ),
            readString(
                listing.state
            ),
            readString(
                listing.zipCode
            )
        ]
            .filter(Boolean)
            .join(', ');

    const details: string[] = [];

    const bedrooms =
        readNumber(
            listing.bedrooms
        );

    const bathrooms =
        readNumber(
            listing.bathrooms
        );

    const squareFeet =
        readNumber(
            listing.squareFeet
        );

    const listPrice =
        readNumber(
            listing.listPrice
        );

    if (bedrooms !== null) {
        details.push(
            `${formatNumber(bedrooms)} bedrooms`
        );
    }

    if (bathrooms !== null) {
        details.push(
            `${formatNumber(bathrooms)} bathrooms`
        );
    }

    if (squareFeet !== null) {
        details.push(
            `${formatNumber(squareFeet)} sq. ft.`
        );
    }

    if (listPrice !== null) {
        details.push(
            formatCurrency(listPrice)
        );
    }

    const property =
        address ||
        'This NavStreet property';

    return details.length > 0
        ? `${property} — ${details.join(' • ')}. View photographs and complete property details on NavStreet.`
        : `${property}. View photographs and complete property details on NavStreet.`;
}

function readShareCode(
    requestPath: string,
    queryValue: unknown
): string {
    const queryCode =
        typeof queryValue === 'string'
            ? queryValue
            : '';

    const pathSegments =
        requestPath
            .split('/')
            .filter(Boolean);

    const pathCode =
        pathSegments[
        pathSegments.length - 1
        ] ?? '';
    return (
        queryCode ||
        pathCode
    )
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9_-]/g,
            ''
        );
}

function readString(
    value: unknown
): string {
    return typeof value === 'string'
        ? value.trim()
        : '';
}

function readNumber(
    value: unknown
): number | null {
    return (
        typeof value === 'number' &&
        Number.isFinite(value)
    )
        ? value
        : null;
}

function readHttpsUrl(
    value: unknown
): string {
    const url =
        readString(value);

    return /^https:\/\//i.test(url)
        ? url
        : '';
}

function normalizeOrigin(
    value: string
): string {
    return value
        .trim()
        .replace(
            /\/+$/g,
            ''
        );
}

function formatCurrency(
    value: number
): string {
    return new Intl.NumberFormat(
        'en-US',
        {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }
    ).format(value);
}

function formatNumber(
    value: number
): string {
    return new Intl.NumberFormat(
        'en-US',
        {
            maximumFractionDigits: 1
        }
    ).format(value);
}

function escapeHtml(
    value: string
): string {
    return value
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}

function escapeHtmlAttribute(
    value: string
): string {
    return escapeHtml(value);
}