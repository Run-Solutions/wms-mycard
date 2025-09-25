// src/utils/MobileCardPreview.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import FileViewer from 'react-native-file-viewer';
import { guessMimeFromName, normalizeToBase64, sniffImageMime, extFromMime, writeBase64 } from './file';

type FileItem = { id: number; type: string; file_path: string };

const isCardImageFile = (f: FileItem) => {
  const t = (f.type || '').toLowerCase();
  const p = (f.file_path || '').toLowerCase();
  return (
    t.includes('card') ||
    p.includes('cardimage') ||
    p.includes('card-img') ||
    p.includes('card_img') ||
    p.includes('card')
  );
};
const isSkuPdfFile = (f: FileItem) => {
  const t = (f.type || '').toLowerCase();
  const p = (f.file_path || '').toLowerCase();
  return t.includes('sku') || p.endsWith('.pdf') || p.includes('/sku');
};

export const MobileCardPreview: React.FC<{
  files: FileItem[];
  getFile: (filename: string) => Promise<any>; // lo que devuelva tu API
}> = ({ files, getFile }) => {
  const [thumbUri, setThumbUri] = React.useState<string | null>(null); // image file://
  const [openUri, setOpenUri] = React.useState<string | null>(null);    // para FileViewer
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Imagen de tarjeta
        const card = files.find(isCardImageFile);
        if (card) {
          const raw = await getFile(card.file_path);
          const { base64, bytes } = normalizeToBase64(raw);

          // MIME por nombre o por “sniffing”
          let mime = guessMimeFromName(card.file_path);
          const sniff = sniffImageMime(bytes);
          if (!mime.startsWith('image/') && sniff) mime = sniff;
          if (!mime.startsWith('image/')) mime = 'image/jpeg';

          const ext = extFromMime(mime); // jpg/png/webp
          const baseName = (card.file_path.split('/').pop() || 'card_image').replace(/\.[^.]+$/, '');
          const fileName = `${baseName}.${ext}`;
          const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory!) + fileName;

          await writeBase64(fileUri, base64);

          if (!mounted) return;
          setThumbUri(fileUri);   // <Image uri />
          setOpenUri(fileUri);    // abrir con FileViewer si tocás
          setLoading(false);
          return;
        }

        // 2) PDF SKU
        const sku = files.find(isSkuPdfFile);
        if (sku) {
          const raw = await getFile(sku.file_path);
          const { base64 } = normalizeToBase64(raw);
          const baseName = (sku.file_path.split('/').pop() || 'sku').replace(/\.[^.]+$/, '');
          const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory!) + `${baseName}.pdf`;
          await writeBase64(fileUri, base64);

          if (!mounted) return;
          setThumbUri(null);
          setOpenUri(fileUri);
          setLoading(false);
          return;
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.warn('Preview error:', e);
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [files, getFile]);

  const onPress = async () => {
    if (!openUri) return;
    try {
      await FileViewer.open(openUri, { showOpenWithDialog: true });
    } catch (e) {
      console.warn('FileViewer error:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator />
      </View>
    );
  }

  if (thumbUri) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.box}>
        <Image source={{ uri: thumbUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  if (openUri && openUri.toLowerCase().endsWith('.pdf')) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.box, styles.pdfBox]}>
        <Text style={{ fontWeight: '700' }}>SKU.pdf</Text>
        <Text style={{ color: '#555' }}>Tocar para abrir</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.box, styles.pdfBox]}>
      <Text style={{ color: '#777', fontWeight: '700' }}>Sin vista previa</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  pdfBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});