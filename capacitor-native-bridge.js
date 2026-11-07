import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';

(() => {
  // Web版には一切介入しない。APK(Android)内だけでネイティブAPIを使う。
  if (Capacitor.getPlatform() !== 'android') return;

  const cancelledMessage = message =>
    /cancel|canceled|cancelled|user denied/i.test(String(message || ''));

  async function applyPhotoToInput(input, photo) {
    if (!input || !photo) return;
    const photoUrl = photo.webPath ||
      (photo.path ? Capacitor.convertFileSrc(photo.path) : null);
    if (!photoUrl) throw new Error('写真データを読み込めませんでした。');

    const response = await fetch(photoUrl);
    if (!response.ok) throw new Error('写真データを取得できませんでした。');
    const blob = await response.blob();
    const mimeType = blob.type || (photo.format ? `image/${photo.format}` : 'image/jpeg');
    const extension = mimeType.includes('png') ? 'png' :
      mimeType.includes('webp') ? 'webp' : 'jpg';
    const file = new File([blob], `friend-chat-photo-${Date.now()}.${extension}`, {
      type: mimeType,
      lastModified: Date.now()
    });

    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function openPhotoPrompt(input) {
    try {
      sessionStorage.setItem('fcPendingPhotoInput', input.id || '');
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        correctOrientation: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: '写真を追加',
        promptLabelPhoto: '写真フォルダから選ぶ',
        promptLabelPicture: 'カメラで撮影'
      });
      sessionStorage.removeItem('fcPendingPhotoInput');
      await applyPhotoToInput(input, photo);
    } catch (error) {
      sessionStorage.removeItem('fcPendingPhotoInput');
      if (!cancelledMessage(error?.message)) {
        console.error('Friend Chat camera/photo picker error:', error);
        alert('写真を開けませんでした。\nカメラや写真へのアクセス設定を確認してください。');
      }
    }
  }

  // label経由・input.click()経由のどちらもネイティブ写真選択に切り替える。
  document.addEventListener('click', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.type !== 'file' || !String(input.accept || '').includes('image')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void openPhotoPrompt(input);
  }, true);

  // AndroidのWebView標準Geolocationではなく、Capacitorの権限要求付きAPIを使う。
  const nativeWatches = new Map();
  const canceledWatches = new Set();
  let watchSequence = 0;

  function toPositionError(error) {
    const message = String(error?.message || error || '位置情報を取得できませんでした。');
    const denied = /denied|permission|not authorized/i.test(message);
    const timedOut = /timeout|timed out/i.test(message);
    return {
      // Web Geolocation APIと同じエラーコードを返す。
      // 1=PERMISSION_DENIED、2=POSITION_UNAVAILABLE、3=TIMEOUT
      code: denied ? 1 : timedOut ? 3 : 2,
      message,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    };
  }

  try {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(success, error, options = {}) {
          Geolocation.getCurrentPosition(options)
            .then(position => success?.(position))
            .catch(reason => error?.(toPositionError(reason)));
        },
        watchPosition(success, error, options = {}) {
          const localId = String(++watchSequence);
          Geolocation.watchPosition(options, (position, reason) => {
            if (reason) error?.(toPositionError(reason));
            else if (position) success?.(position);
          }).then(nativeId => {
            if (canceledWatches.has(localId)) {
              canceledWatches.delete(localId);
              void Geolocation.clearWatch({ id: nativeId });
            } else {
              nativeWatches.set(localId, nativeId);
            }
          }).catch(reason => error?.(toPositionError(reason)));
          return localId;
        },
        clearWatch(localId) {
          const key = String(localId);
          const nativeId = nativeWatches.get(key);
          if (nativeId) {
            nativeWatches.delete(key);
            void Geolocation.clearWatch({ id: nativeId });
          } else {
            canceledWatches.add(key);
          }
        }
      }
    });
  } catch (error) {
    console.warn('Could not install native geolocation bridge:', error);
  }

  // カメラ起動中にAndroidがアプリを再生成した場合の復帰処理。
  App.addListener('appRestoredResult', async result => {
    if (result?.pluginId !== 'Camera' || result?.methodName !== 'getPhoto' || !result?.success) return;
    const inputId = sessionStorage.getItem('fcPendingPhotoInput');
    sessionStorage.removeItem('fcPendingPhotoInput');
    const input = inputId ? document.getElementById(inputId) : null;
    if (!input) return;
    try {
      await applyPhotoToInput(input, result.data);
    } catch (error) {
      console.error('Could not restore camera result:', error);
      alert('撮影した写真を読み込めませんでした。もう一度お試しください。');
    }
  });
})();
