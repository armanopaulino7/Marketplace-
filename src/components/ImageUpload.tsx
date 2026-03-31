import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
  maxSize?: number; // in MB
  folder?: string;
  accept?: string;
}

export default function ImageUpload({ onUpload, label, maxSize = 2, folder = 'produtos', accept = 'image/*' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > maxSize * 1024 * 1024) {
        alert(`O arquivo é muito grande. O tamanho máximo é ${maxSize}MB.`);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload data:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Image uploaded successfully. Public URL:', publicUrl);
      onUpload(publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Erro ao carregar imagem: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">{label}</label>}
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          relative h-32 w-full border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl 
          flex flex-col items-center justify-center gap-2 cursor-pointer 
          hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Carregando...</p>
          </>
        ) : (
          <>
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl group-hover:bg-white dark:group-hover:bg-stone-800 transition-colors">
              <Upload className="h-6 w-6 text-stone-400 dark:text-stone-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </div>
            <p className="text-xs font-bold text-stone-500 dark:text-stone-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Clique para fazer upload</p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500">
              {accept === 'image/*' ? `PNG, JPG ou WEBP até ${maxSize}MB` : `Arquivo até ${maxSize}MB`}
            </p>
          </>
        )}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleUpload}
          accept={accept}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
}
