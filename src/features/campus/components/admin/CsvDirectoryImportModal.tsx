import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppMessageModal, AppMessageType, LogoLoader } from '@/components/ui';
import { Typography } from '@/constants/fonts';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { useColors } from '@/theme/app-theme';

import {
  DIRECTORY_TEMPLATE_HEADERS,
  downloadDirectoryCsvTemplateApi,
  ImportBatchResult,
  uploadDirectoryCsvApi,
} from '../../api/user-import-api';

interface CsvDirectoryImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CsvDirectoryImportModal({ visible, onClose }: CsvDirectoryImportModalProps) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const { user } = useAuthSession();

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size?: number;
    uri: string;
    mimeType?: string;
  } | null>(null);

  const [busy, setBusy] = useState<'download' | 'upload' | null>(null);
  const [batchResult, setBatchResult] = useState<ImportBatchResult | null>(null);
  const [showTemplateView, setShowTemplateView] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: AppMessageType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAppModal = (title: string, message: string, type: AppMessageType = 'info') => {
    setModalConfig({ visible: true, title, message, type });
  };

  const handleDownloadTemplate = async () => {
    if (busy) return;
    try {
      setBusy('download');
      await downloadDirectoryCsvTemplateApi(user?.token, user?.tenantId);
      showAppModal(
        'Template ready',
        'Save the .xlsx (Drive / Files), open it in Excel or Sheets, fill rows under the yellow headers, then upload that file here.',
        'success',
      );
    } catch (err: any) {
      showAppModal('Template', err?.message || 'Could not download the template.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const handlePickCsv = async () => {
    if (busy) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/comma-separated-values',
          'text/plain',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const lower = asset.name.toLowerCase();
        const isOk =
          lower.endsWith('.xlsx') ||
          lower.endsWith('.xls') ||
          lower.endsWith('.csv') ||
          lower.endsWith('.txt') ||
          asset.mimeType?.toLowerCase().includes('sheet') ||
          asset.mimeType?.toLowerCase().includes('excel') ||
          asset.mimeType?.toLowerCase().includes('csv');

        if (!isOk) {
          showAppModal(
            'Invalid Format',
            'Please select the Excel template (.xlsx) or a CSV with the same headers.',
            'warning',
          );
          return;
        }

        setSelectedFile({
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
          mimeType: asset.mimeType,
        });
        setBatchResult(null);
      }
    } catch (err: any) {
      showAppModal('Error', err?.message || 'Could not select directory file', 'error');
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) {
      showAppModal('File Required', 'Please select the filled Excel (.xlsx) or CSV file to import.', 'warning');
      return;
    }
    if (busy) return;

    try {
      setBusy('upload');
      const res = await uploadDirectoryCsvApi(user?.token, user?.tenantId, selectedFile);
      setBatchResult(res);
      showAppModal(
        'Import Succeeded',
        `Processed ${res.totalRows} directory records: ${res.createdCount} created, ${res.updatedCount} updated.`,
        'success',
      );
    } catch (err: any) {
      showAppModal('Import Failed', err?.message || 'Could not import the directory file', 'error');
    } finally {
      setBusy(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#F8FAFC" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <View style={styles.superBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#A78BFA" />
              <Text style={styles.superBadgeText}>SUPER ADMIN ONLY</Text>
            </View>
            <Text style={styles.headerTitle}>College Directory Importer</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={styles.infoBanner}>
            <View style={styles.infoBannerIcon}>
              <Ionicons name="people" size={24} color="#A78BFA" />
            </View>
            <View style={styles.infoBannerCopy}>
              <Text style={styles.infoBannerTitle}>Batch User & Hostel Provisioning</Text>
              <Text style={styles.infoBannerSub}>
                Download the Excel template (yellow headers, empty rows), fill data manually, then
                upload — same as CDRMS.
              </Text>
            </View>
          </View>

          {/* CDRMS-style: Download Template | Upload */}
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Download Excel template"
              onPress={() => void handleDownloadTemplate()}
              disabled={busy != null}
              style={({ pressed }) => [
                styles.secondaryActionBtn,
                (busy != null || pressed) && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="download-outline" size={16} color="#F8FAFC" />
              <Text style={styles.secondaryActionText}>
                {busy === 'download' ? 'Downloading…' : 'Download Template'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose Excel file to upload"
              onPress={() => void handlePickCsv()}
              disabled={busy != null}
              style={({ pressed }) => [
                styles.primaryActionBtn,
                (busy != null || pressed) && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#080B11" />
              <Text style={styles.primaryActionText}>Upload Excel</Text>
            </Pressable>
          </View>

          {/* Template Helper Card */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Expected columns</Text>
              <Pressable
                onPress={() => setShowTemplateView((prev) => !prev)}
                style={styles.templateToggleBtn}
              >
                <Text style={styles.templateToggleText}>
                  {showTemplateView ? 'Hide columns' : 'View columns'}
                </Text>
                <Ionicons
                  name={showTemplateView ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#A78BFA"
                />
              </Pressable>
            </View>

            <View style={styles.chipsWrap}>
              {[
                'usn *',
                'fullName *',
                'collegeEmail *',
                'password *',
                'department',
                'batch',
                'program',
                'hostelite (yes/no)',
                'role',
                'mobile',
              ].map((col) => (
                <View key={col} style={styles.colChip}>
                  <Text style={styles.colChipText}>{col}</Text>
                </View>
              ))}
            </View>

            {showTemplateView && (
              <View style={styles.sampleBox}>
                <Text style={styles.sampleText}>
                  Headers only (no sample rows):{'\n'}
                  {DIRECTORY_TEMPLATE_HEADERS}
                </Text>
              </View>
            )}
          </View>

          {/* File Picker Section */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Selected file</Text>

            {selectedFile ? (
              <View style={styles.selectedFileCard}>
                <View style={styles.fileIconBox}>
                  <Ionicons name="document-text" size={24} color="#10B981" />
                  <View style={styles.fileTag}>
                    <Text style={styles.fileTagText}>
                      {selectedFile.name.toLowerCase().endsWith('.xlsx') ||
                      selectedFile.name.toLowerCase().endsWith('.xls')
                        ? 'XLSX'
                        : 'CSV'}
                    </Text>
                  </View>
                </View>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {formatFileSize(selectedFile.size) || 'Ready for processing'}
                  </Text>
                </View>
                <Pressable onPress={handlePickCsv} style={styles.changeBtn}>
                  <Ionicons name="swap-horizontal" size={16} color="#A78BFA" />
                </Pressable>
                <Pressable onPress={() => setSelectedFile(null)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={handlePickCsv}
                style={styles.dropzone}
              >
                <View style={styles.dropzoneIconBox}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#A78BFA" />
                </View>
                <Text style={styles.dropzoneTitle}>Choose filled .xlsx template</Text>
                <Text style={styles.dropzoneSub}>
                  Max 5MB • Excel (.xlsx) or CSV with the same headers
                </Text>
              </Pressable>
            )}
          </View>

          {/* Batch Result (If processed) */}
          {batchResult && (
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.resultsTitle}>Batch Import Completed</Text>
              </View>

              <View style={styles.kpiGrid}>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiVal}>{batchResult.totalRows}</Text>
                  <Text style={styles.kpiLabel}>Total</Text>
                </View>
                <View style={[styles.kpiBox, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                  <Text style={[styles.kpiVal, { color: '#10B981' }]}>
                    {batchResult.createdCount}
                  </Text>
                  <Text style={styles.kpiLabel}>Created</Text>
                </View>
                <View style={[styles.kpiBox, { borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
                  <Text style={[styles.kpiVal, { color: '#3B82F6' }]}>
                    {batchResult.updatedCount}
                  </Text>
                  <Text style={styles.kpiLabel}>Updated</Text>
                </View>
                <View style={styles.kpiBox}>
                  <Text style={[styles.kpiVal, { color: '#EF4444' }]}>
                    {batchResult.errorCount}
                  </Text>
                  <Text style={styles.kpiLabel}>Errors</Text>
                </View>
              </View>
            </View>
          )}

          {/* Execute Button */}
          <Pressable
            onPress={() => void handleExecuteImport()}
            disabled={!selectedFile || busy != null}
            style={[
              styles.primaryBtn,
              (!selectedFile || busy != null) && { opacity: 0.5 },
            ]}
          >
            <Ionicons name="flash" size={18} color="#080B11" />
            <Text style={styles.primaryBtnText}>
              {busy === 'upload' ? 'Processing file...' : 'Execute Bulk Directory Import'}
            </Text>
          </Pressable>
        </ScrollView>

        {/* Busy Loader Overlay */}
        {busy != null && (
          <LogoLoader
            overlay
            size={56}
            text={
              busy === 'download'
                ? 'Downloading directory Excel template...'
                : 'Super Admin: Parsing & importing directory...'
            }
          />
        )}

        {/* Message Modal */}
        <AppMessageModal
          visible={modalConfig.visible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
        />
      </View>
    </Modal>
  );
}

function createStyles(Colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#080B11',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#1E293B',
      gap: 12,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitleWrap: {
      flex: 1,
    },
    superBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(167, 139, 250, 0.14)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(167, 139, 250, 0.3)',
      marginBottom: 3,
    },
    superBadgeText: {
      fontFamily: Typography.bold,
      fontSize: 10,
      color: '#C4B5FD',
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontFamily: Typography.bold,
      fontSize: 17,
      color: '#F8FAFC',
      fontWeight: '700',
    },
    scrollBody: {
      padding: 20,
      paddingBottom: 40,
    },
    infoBanner: {
      flexDirection: 'row',
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 18,
      padding: 16,
      gap: 14,
      marginBottom: 20,
    },
    infoBannerIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(167, 139, 250, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoBannerCopy: {
      flex: 1,
    },
    infoBannerTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: '#F8FAFC',
      fontWeight: '600',
    },
    infoBannerSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#94A3B8',
      lineHeight: 18,
      marginTop: 4,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    secondaryActionBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#334155',
      backgroundColor: '#0F172A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    secondaryActionText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
      color: '#F8FAFC',
    },
    primaryActionBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(167, 139, 250, 0.45)',
      backgroundColor: '#A78BFA',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    primaryActionText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: '700',
      color: '#080B11',
    },
    cardSection: {
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 18,
      padding: 16,
      marginBottom: 20,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: '#F8FAFC',
      fontWeight: '600',
      marginBottom: 8,
    },
    templateToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    templateToggleText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: '#A78BFA',
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    colChip: {
      backgroundColor: '#1E293B',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    colChipText: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#CBD5E1',
    },
    sampleBox: {
      backgroundColor: '#080B11',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },
    sampleText: {
      fontFamily: Typography.regular,
      fontSize: 10,
      color: '#94A3B8',
      lineHeight: 16,
    },
    dropzone: {
      borderWidth: 1.5,
      borderColor: '#334155',
      borderStyle: 'dashed',
      borderRadius: 16,
      paddingVertical: 28,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111827',
    },
    dropzoneIconBox: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: 'rgba(167, 139, 250, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    dropzoneTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: '#F8FAFC',
      fontWeight: '600',
    },
    dropzoneSub: {
      fontFamily: Typography.regular,
      fontSize: 12,
      color: '#64748B',
      marginTop: 4,
    },
    selectedFileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.4)',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 12,
    },
    fileIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    fileTag: {
      position: 'absolute',
      bottom: -3,
      backgroundColor: '#10B981',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
    },
    fileTagText: {
      fontSize: 8,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    fileDetails: {
      flex: 1,
    },
    fileName: {
      fontFamily: Typography.medium,
      fontSize: 13,
      color: '#F8FAFC',
    },
    fileSize: {
      fontFamily: Typography.regular,
      fontSize: 11,
      color: '#94A3B8',
      marginTop: 2,
    },
    changeBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultsCard: {
      backgroundColor: '#0F172A',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.35)',
      borderRadius: 18,
      padding: 16,
      marginBottom: 20,
    },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    resultsTitle: {
      fontFamily: Typography.bold,
      fontSize: 15,
      color: '#F8FAFC',
      fontWeight: '600',
    },
    kpiGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    kpiBox: {
      flex: 1,
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: '#1E293B',
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
    },
    kpiVal: {
      fontFamily: Typography.bold,
      fontSize: 16,
      color: '#F8FAFC',
      fontWeight: '700',
    },
    kpiLabel: {
      fontFamily: Typography.regular,
      fontSize: 10,
      color: '#94A3B8',
      marginTop: 2,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#A78BFA',
      borderRadius: 24,
      paddingVertical: 15,
      gap: 8,
      marginTop: 4,
    },
    primaryBtnText: {
      fontFamily: Typography.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#080B11',
    },
  });
}
