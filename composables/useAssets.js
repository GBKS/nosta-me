export default function useAssets(asset) {
  const assets = import.meta.glob('/assets/images/*.jpg', {eager: true});
  const assetsPng = import.meta.glob('/assets/images/*.png', {eager: true});
  const themeAssets = import.meta.glob('/assets/images/themes/*.jpg', {eager: true});
  const themeAssetsPng = import.meta.glob('/assets/images/themes/*.png', {eager: true});
  const previewAssets = import.meta.glob('/assets/images/themes/preview/*.jpg', {eager: true});
  const previewAssetsPng = import.meta.glob('/assets/images/themes/preview/*.png', {eager: true});
  const appAssets = import.meta.glob('/assets/images/apps/*.jpg', {eager: true});
  const appAssetsPng = import.meta.glob('/assets/images/apps/*.png', {eager: true});

  const locations = [
    assets,
    assetsPng,
    themeAssets,
    themeAssetsPng,
    previewAssets,
    previewAssetsPng,
    appAssets,
    appAssetsPng
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