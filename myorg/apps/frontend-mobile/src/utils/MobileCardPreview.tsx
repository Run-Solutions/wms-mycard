// src/utils/MobileCardPreview.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import FileViewer from 'react-native-file-viewer';
import { guessMimeFromName, normalizeToBase64, sniffImageMime, extFromMime, writeBase64 } from './file';
import PdfThumbnail from 'react-native-pdf-thumbnail';

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
  return t.includes('sku') || p.includes('sku');
};

export const MobileCardPreview: React.FC<{
  files: FileItem[];
  getFile: (filename: string) => Promise<any>;
}> = ({ files, getFile }) => {
  const [thumbUri, setThumbUri] = React.useState<string | null>(null); // imagen para <Image />
  const [openUri, setOpenUri] = React.useState<string | null>(null);    // pdf para FileViewer
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) CARD IMAGE (prioridad)
        const card = files.find(isCardImageFile);
        if (card) {
          const raw = await getFile(card.file_path);
          const { base64, bytes } = normalizeToBase64(raw);
          let mime = guessMimeFromName(card.file_path);
          const sniff = sniffImageMime(bytes);
          if (!mime.startsWith('image/') && sniff) mime = sniff;
          if (!mime.startsWith('image/')) mime = 'image/jpeg';

          const ext = extFromMime(mime);
          const baseName = (card.file_path.split('/').pop() || 'card_image').replace(/\.[^.]+$/, '');
          const fileName = `${baseName}.${ext}`;
          const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory!) + fileName;
          await writeBase64(fileUri, base64);

          if (!mounted) return;
          setThumbUri(fileUri);   // miniatura
          setOpenUri(fileUri);    // “abrir con…”
          setLoading(false);
          return;
        }

        // 2) SKU.pdf => generar thumbnail (1ª página) y guardar pdf para abrir
        const sku = files.find(isSkuPdfFile);
        if (sku) {
          const raw = await getFile(sku.file_path);
          const { base64 } = normalizeToBase64(raw);
          const baseName = (sku.file_path.split('/').pop() || 'sku').replace(/\.[^.]+$/, '');
          const pdfUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory!) + `${baseName}.pdf`;
          await writeBase64(pdfUri, base64);

          // 👇 genera PNG de la primera página
          const { uri: thumbPng } = await PdfThumbnail.generate(pdfUri, 0); // pageIndex 0

          if (!mounted) return;
          setThumbUri(thumbPng);  // <Image /> igual que web
          setOpenUri(pdfUri);     // abrir con FileViewer
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

  // Mostrar SIEMPRE imagen (card o thumbnail del PDF), igual que web
  if (thumbUri) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.box}>
        <Image source={{ uri: thumbUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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
    height: 180,             // 👈 misma altura que en web
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