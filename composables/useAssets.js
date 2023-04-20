export default function useAssets(asset) {
  const assets = import.meta.glob('/assets/images/*.jpg', {eager: true});
  const themeAssets = import.meta.glob('/assets/images/themes/*.jpg', {eager: true});
  const previewAssets = import.meta.glob('/assets/images/themes/preview/*.jpg', {eager: true});
  const appAssets = import.meta.glob('/assets/images/apps/*.jpg', {eager: true});

  const locations = [
    assets,
    themeAssets,
    previewAssets,
    appAssets
  ]

  const getAssetUrl = () => {
    for(let i=0; i<locations.length; i++) {
      if(locations[i][asset]) {
        return locations[i][asset].default
      }
    }
    return null
  }

  return getAssetUrl()
}