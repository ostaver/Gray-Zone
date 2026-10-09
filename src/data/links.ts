export const releaseVersion = '1.0.1';

export const repo = 'https://github.com/alrk855/GrayZone';

export const latestRelease = `${repo}/releases/latest`;

export const releaseTag = `v.${releaseVersion}`;
export const releaseNotes = `${repo}/releases/tag/${releaseTag}`;
export const releaseAssets = {
  windows: {
    file: 'GrayZoneWin.zip',
    bytes: 152290982,
  },
  mac: {
    file: 'GrayZoneMac.zip',
    bytes: 182167471,
  },
} as const;

export const releases = {
  windows: `${repo}/releases/download/${releaseTag}/${releaseAssets.windows.file}`,
  mac: `${repo}/releases/download/${releaseTag}/${releaseAssets.mac.file}`,
} as const;

export const socials = {
  email: 'sivazona.edukativnaigra@gmail.com',
  instagram: 'https://www.instagram.com/sivazona.igra',
  instagramHandle: 'sivazona.igra',
} as const;
