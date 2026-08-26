import { supabase } from './supabaseClient';
import { SERVICES_PACKAGES as INITIAL_PHOTOGRAPHY_PACKAGES } from '../data/packagesData';
import { PRINTING_DESIGN_SERVICES as INITIAL_COLORLAB_SERVICES } from '../data/servicesData';

const PACKAGES_STORAGE_KEY = 'kpr_site_packages_v3';

function getLocalPackages() {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Initialize seed packages if empty
  const initial = [
    ...INITIAL_PHOTOGRAPHY_PACKAGES.map((pkg, idx) => ({
      id: `pkg-${pkg.id}`,
      type: 'photography',
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration || '6 hours',
      category: pkg.category || 'Photography',
      image: pkg.image || '/images/packages/user_pkg_candid_photo.png',
      popular: Boolean(pkg.popular),
      description: `Professional ${pkg.category} coverage by KPR Productions master artists.`,
      features: [
        `${pkg.duration || 'Full event'} on-site coverage`,
        'High-resolution raw & edited deliverables',
        'Direct cloud delivery & print license'
      ],
      display_order: idx + 1,
      status: 'active',
      created_at: new Date().toISOString()
    })),
    ...INITIAL_COLORLAB_SERVICES.map((s, idx) => ({
      id: `cl-pkg-${s.id}`,
      type: 'colorlab',
      name: s.title,
      price: 2500 * (idx + 1),
      duration: 'Print & Framing',
      category: s.category || 'Prints',
      image: s.image,
      popular: idx === 0,
      description: s.description || s.tagline,
      features: [
        'Archival grade HD printing',
        'Custom sizing & edge finishing',
        'Long-lasting anti-fade guarantee'
      ],
      display_order: idx + 1,
      status: 'active',
      created_at: new Date().toISOString()
    }))
  ];
  saveLocalPackages(initial);
  return initial;
}

function saveLocalPackages(packages) {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {}
}

export async function fetchSitePackages(type = 'photography', includeHidden = false) {
  const targetType = (type || 'photography').toLowerCase().trim();

  try {
    let query = supabase
      .from('packages')
      .select('*')
      .eq('type', targetType)
      .order('display_order', { ascending: true });

    if (!includeHidden) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.filter(p => p.type === targetType && (includeHidden || p.status === 'active'));
    }
  } catch (err) {
    console.warn('Supabase packages query failed, using local store:', err);
  }

  const local = getLocalPackages();
  return local.filter(p => p.type === targetType && (includeHidden || p.status === 'active'));
}

export async function saveSitePackage(pkgPayload) {
  const isEdit = Boolean(pkgPayload.id);
  const pkgData = {
    id: pkgPayload.id || `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: pkgPayload.type || 'photography',
    name: pkgPayload.name,
    price: Number(pkgPayload.price) || 0,
    duration: pkgPayload.duration || 'Event Coverage',
    category: pkgPayload.category || 'Package',
    image: pkgPayload.image || '/images/packages/user_pkg_candid_photo.png',
    popular: Boolean(pkgPayload.popular),
    description: pkgPayload.description || '',
    features: Array.isArray(pkgPayload.features) ? pkgPayload.features.filter(Boolean) : [],
    display_order: Number(pkgPayload.display_order) || 1,
    status: pkgPayload.status || 'active',
    updated_at: new Date().toISOString(),
    created_at: pkgPayload.created_at || new Date().toISOString()
  };

  try {
    let res;
    if (isEdit) {
      res = await supabase
        .from('packages')
        .update(pkgData)
        .eq('id', pkgData.id)
        .select();
    } else {
      res = await supabase
        .from('packages')
        .insert([pkgData])
        .select();
    }

    if (!res.error && res.data && res.data.length > 0) {
      const saved = res.data[0];
      const local = getLocalPackages();
      if (isEdit) {
        saveLocalPackages(local.map(p => p.id === saved.id ? saved : p));
      } else {
        saveLocalPackages([saved, ...local]);
      }
      return { data: saved, error: null };
    }
  } catch (err) {
    console.warn('Supabase package save error, updating local cache:', err);
  }

  const local = getLocalPackages();
  if (isEdit) {
    saveLocalPackages(local.map(p => p.id === pkgData.id ? pkgData : p));
  } else {
    saveLocalPackages([pkgData, ...local]);
  }
  return { data: pkgData, error: null };
}

export async function deleteSitePackage(packageId) {
  try {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId);

    if (!error) {
      const local = getLocalPackages();
      saveLocalPackages(local.filter(p => p.id !== packageId));
      return { error: null };
    }
  } catch (err) {
    console.warn('Supabase package delete error, removing locally:', err);
  }

  const local = getLocalPackages();
  saveLocalPackages(local.filter(p => p.id !== packageId));
  return { error: null };
}
