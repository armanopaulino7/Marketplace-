import React, { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Download, X, Check, Video, Image as ImageIcon, File } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import ImageUpload from './ImageUpload';

interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: 'image' | 'video' | 'pdf' | 'text';
  product_id: string;
  produtos: {
    name: string;
  };
}

export function SupportMaterials({ mode = 'affiliate' }: { mode?: 'affiliate' | 'producer' }) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'image' | 'video' | 'pdf' | 'text'>('image');
  const [productId, setProductId] = useState('');

  useEffect(() => {
    if (user) {
      fetchMaterials();
      if (mode === 'producer') fetchProducts();
    }
  }, [user, mode]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    let query = supabase
      .from('support_materials')
      .select('*, produtos(name)');

    if (mode === 'producer') {
      query = query.eq('producer_id', user?.id);
    } else {
      // For affiliates, we only show materials for products they are affiliated with
      // This is handled by RLS, but we can also filter here if needed
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setMaterials(data);
    setIsLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('id, name')
      .eq('producer_id', user?.id);
    
    if (data) setProducts(data);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      alert('Por favor, faça o upload do arquivo ou insira a URL.');
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase
      .from('support_materials')
      .insert({
        title,
        description,
        file_url: fileUrl,
        file_type: fileType,
        producer_id: user?.id,
        product_id: productId,
      });

    if (!error) {
      setShowAddModal(false);
      resetForm();
      fetchMaterials();
    } else {
      alert('Erro ao adicionar material: ' + error.message);
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFileUrl('');
    setFileType('image');
    setProductId('');
  };

  const deleteMaterial = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      await supabase.from('support_materials').delete().eq('id', id);
      fetchMaterials();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-6 w-6" />;
      case 'image': return <ImageIcon className="h-6 w-6" />;
      case 'pdf': return <File className="h-6 w-6" />;
      default: return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Materiais de Apoio</h2>
          <p className="text-sm text-stone-500">Recursos para ajudar nas suas vendas</p>
        </div>
        {mode === 'producer' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <Plus className="h-5 w-5" />
            Adicionar Material
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[2rem]" />
          ))
        ) : materials.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-stone-900 rounded-[2rem] border border-dashed border-stone-200 dark:border-stone-800">
            <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">Nenhum material de apoio disponível.</p>
          </div>
        ) : (
          materials.map((material) => (
            <div key={material.id} className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] border border-stone-100 dark:border-stone-800 transition-all hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-none group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  {getIcon(material.file_type)}
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={material.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {mode === 'producer' && (
                    <button 
                      onClick={() => deleteMaterial(material.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-stone-900 dark:text-white tracking-tight">{material.title}</h3>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{material.produtos?.name}</p>
              </div>

              {material.file_type === 'image' && (
                <div className="mt-4 aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-800">
                  <img 
                    src={material.file_url} 
                    alt={material.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {material.file_type === 'video' && (
                <div className="mt-4 aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-800">
                  <video 
                    src={material.file_url} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 leading-relaxed whitespace-pre-wrap">
                {material.description}
              </p>

              <div className="mt-6 pt-6 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Tipo: {material.file_type}</span>
                {material.file_type === 'text' && (
                  <a 
                    href={material.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:underline"
                  >
                    Abrir Link
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 dark:border-stone-800 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-stone-900 dark:text-white">Novo Material</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors">
                <X className="h-6 w-6 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="EX: Banner para Instagram"
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique como usar este material..."
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Tipo de Arquivo</label>
                  <select
                    value={fileType}
                    onChange={(e) => {
                      setFileType(e.target.value as any);
                      setFileUrl('');
                    }}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                    <option value="pdf">PDF</option>
                    <option value="text">Texto/Copy</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Arquivo</label>
                  {fileType === 'text' ? (
                    <input
                      type="url"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  ) : (
                    <div className="mt-1">
                      <ImageUpload
                        onUpload={setFileUrl}
                        folder="support_materials"
                        maxSize={50}
                        accept={
                          fileType === 'image' ? 'image/*' :
                          fileType === 'video' ? 'video/*' :
                          fileType === 'pdf' ? 'application/pdf' :
                          '*/*'
                        }
                      />
                      {fileUrl && (
                        <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-bold">
                          Arquivo carregado com sucesso!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Produto Relacionado</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione um Produto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                {isSubmitting ? 'Adicionando...' : 'Adicionar Material'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
