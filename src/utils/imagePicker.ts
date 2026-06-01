import { Alert, Platform, PermissionsAndroid } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
} from 'react-native-image-picker';

const libraryOptions: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 0.8,
  selectionLimit: 1,
  includeBase64: false,
};

const cameraOptions: CameraOptions = {
  mediaType: 'photo',
  quality: 0.8,
  saveToPhotos: false,
  includeBase64: false,
};

const extractUri = (response: ImagePickerResponse): string | null => {
  if (response.didCancel || response.errorCode) {
    if (response.errorMessage) {
      Alert.alert('Image picker error', response.errorMessage);
    }
    return null;
  }
  return response.assets?.[0]?.uri ?? null;
};

const requestAndroidCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const imagePicker = {
  async pickFromLibrary(): Promise<string | null> {
    return new Promise(resolve => {
      launchImageLibrary(libraryOptions, response => {
        resolve(extractUri(response));
      });
    });
  },

  async takePhoto(): Promise<string | null> {
    const allowed = await requestAndroidCameraPermission();
    if (!allowed) {
      Alert.alert('Permission required', 'Please allow camera access to take a photo.');
      return null;
    }

    return new Promise(resolve => {
      launchCamera(cameraOptions, response => {
        resolve(extractUri(response));
      });
    });
  },

  showPickerOptions(onSelected: (uri: string) => void): void {
    Alert.alert('Add Photo', 'Choose how you want to add an image to your post', [
      { text: 'Take Photo', onPress: () => imagePicker.takePhoto().then(uri => uri && onSelected(uri)) },
      {
        text: 'Choose from Library',
        onPress: () => imagePicker.pickFromLibrary().then(uri => uri && onSelected(uri)),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  },
};
