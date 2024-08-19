export default function useAssets(asset) {
  const assets = import.meta.glob('/assets/images/*.jpg', {eager: false});
  const assetsPng = import.meta.glob('/assets/images/*.png', {eager: false});
  const themeAssets = import.meta.glob('/assets/images/themes/*.jpg', {eager: false});
  const themeAssetsPng = import.meta.glob('/assets/images/themes/*.png', {eager: false});
  const previewAssets = import.meta.glob('/assets/images/themes/preview/*.jpg', {eager: false});
  const previewAssetsPng = import.meta.glob('/assets/images/themes/preview/*.png', {eager: false});
  const appAssets = import.meta.glob('/assets/images/apps/*.jpg', {eager: false});
  const appAssetsPng = import.meta.glob('/assets/images/apps/*.png', {eager: false});

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

  const getAssetUrl = async () => {
    for(let i=0; i<locations.length; i++) {
      if(locations[i][asset]) {
        const module = await locations[i][asset]();
        return module.default;
      }
    }
    return null
  }

  return getAssetUrl()
}