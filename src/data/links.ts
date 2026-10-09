export const releaseVersion = '1.0.1';

export const repo = 'https://github.com/alrk855/GrayZone';

export const latestRelease = `${repo}/releases/latest`;

export const releaseTag = `v.${releaseVersion}`;
export const releaseNotes = `${repo}/releases/tag/${releaseTag}`;
export const releaseDate = '2025-11-10';
export const releaseAssets = {
  windows: {
    file: 'GrayZoneWin.zip',
    bytes: 152290982,
    sha256: 'da8922a6635e39f986f40e8367e8e2eb974ad3abea1c78f8b539ee1e8181cbdd',
  },
  mac: {
    file: 'GrayZoneMac.zip',
    bytes: 182167471,
    sha256: '9016eae075c4efaf3d8c1b6ce0f473f35b897999a0ed4ac4f112cf2479c65f1c',
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
