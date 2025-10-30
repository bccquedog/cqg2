"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X } from 'lucide-react';

interface MembershipTier {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  features: string[];
  stripeProductId: string;
  stripePriceId: string;
  buyInOverride?: {
    exempt: boolean;
    discountPercent: number;
  };
  updatedAt?: unknown;
  updatedBy?: string;
}

interface MembershipFormData {
  name: string;
  description: string;
  priceUSD: number;
  features: string;
  stripeProductId: string;
  stripePriceId: string;
  exempt: boolean;
  discountPercent: number;
}

export default function MembershipsPanel() {
  const [memberships, setMemberships] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const [formData, setFormData] = useState<MembershipFormData>({
    name: '',
    description: '',
    priceUSD: 0,
    features: '',
    stripeProductId: '',
    stripePriceId: '',
    exempt: false,
    discountPercent: 0
  });

  // Fetch memberships from Firestore
  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const membershipsRef = collection(db, 'memberships');
      const snapshot = await getDocs(membershipsRef);
      
      const membershipsData: MembershipTier[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        membershipsData.push({
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          priceUSD: data.priceUSD || 0,
          features: data.features || [],
          stripeProductId: data.stripeProductId || '',
          stripePriceId: data.stripePriceId || '',
          buyInOverride: data.buyInOverride || { exempt: false, discountPercent: 0 },
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });
      });
      
      setMemberships(membershipsData);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof MembershipFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle edit button click
  const handleEdit = (tier: MembershipTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description,
      priceUSD: tier.priceUSD,
      features: tier.features.join(', '),
      stripeProductId: tier.stripeProductId,
      stripePriceId: tier.stripePriceId,
      exempt: tier.buyInOverride?.exempt || false,
      discountPercent: tier.buyInOverride?.discountPercent || 0
    });
    setIsModalOpen(true);
  };

  // Handle add new tier
  const handleAddNew = () => {
    setEditingTier(null);
    setFormData({
      name: '',
      description: '',
      priceUSD: 0,
      features: '',
      stripeProductId: 'pending',
      stripePriceId: 'pending',
      exempt: false,
      discountPercent: 0
    });
    setIsModalOpen(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    try {
      const featuresArray = formData.features
        .split(',')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);

      // Validate and clamp discount percent
      const clampedDiscount = Math.max(0, Math.min(100, formData.discountPercent));
      
      const membershipData = {
        name: formData.name,
        description: formData.description,
        priceUSD: Number(formData.priceUSD),
        features: featuresArray,
        stripeProductId: formData.stripeProductId,
        stripePriceId: formData.stripePriceId,
        buyInOverride: {
          exempt: formData.exempt || false,
          discountPercent: formData.exempt ? 0 : clampedDiscount
        },
        updatedAt: serverTimestamp(),
        updatedBy: 'adminPanel' // TODO: Replace with actual user email when auth is implemented
      };

      let docId: string;
      if (editingTier) {
        // Update existing tier
        docId = editingTier.id;
        const docRef = doc(db, 'memberships', docId);
        await setDoc(docRef, membershipData);
      } else {
        // Create new tier
        docId = formData.name.toLowerCase().replace(/\s+/g, '');
        const docRef = doc(db, 'memberships', docId);
        await setDoc(docRef, membershipData);
      }

      // Create audit log entry
      const auditLogData = {
        tierId: docId,
        changes: {
          name: formData.name,
          priceUSD: Number(formData.priceUSD),
          description: formData.description,
          features: featuresArray,
          buyInOverride: {
            exempt: formData.exempt || false,
            discountPercent: formData.exempt ? 0 : clampedDiscount
          }
        },
        updatedAt: serverTimestamp(),
        updatedBy: 'adminPanel' // TODO: Replace with actual user email when auth is implemented
      };

      // Write to audit log collection
      const auditLogRef = collection(db, 'adminControls', 'history', 'membershipUpdates');
      await addDoc(auditLogRef, auditLogData);

      setIsModalOpen(false);
      await fetchMemberships();
    } catch (error) {
      console.error('Error saving membership:', error);
    }
  };

  // Format date for display
  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Never';
    const date = (timestamp as { toDate?: () => Date }).toDate ? 
      (timestamp as { toDate: () => Date }).toDate() : 
      new Date(timestamp as string | number);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading memberships...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Membership Tiers</h1>
          <p className="text-gray-400 mt-1">Manage membership tiers and pricing</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {/* Memberships Table */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Membership Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800">
                  <TableHead className="text-gray-300">Tier Name</TableHead>
                  <TableHead className="text-gray-300">Price</TableHead>
                  <TableHead className="text-gray-300">Features</TableHead>
                  <TableHead className="text-gray-300">Buy-In Override</TableHead>
                  <TableHead className="text-gray-300">Last Updated</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((tier) => (
                  <TableRow key={tier.id} className="border-gray-700 hover:bg-gray-800">
                    <TableCell className="text-white font-medium">{tier.name}</TableCell>
                    <TableCell className="text-white">
                      {tier.priceUSD === 0 ? (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          Free
                        </Badge>
                      ) : (
                        <span className="text-green-400 font-semibold">${tier.priceUSD}/mo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {tier.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {tier.buyInOverride?.exempt ? (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          Exempt
                        </Badge>
                      ) : (tier.buyInOverride?.discountPercent ?? 0) > 0 ? (
                        <Badge variant="outline" className="border-blue-500 text-blue-400">
                          {tier.buyInOverride?.discountPercent}% discount
                        </Badge>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {formatDate(tier.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tier)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTier ? 'Edit Membership Tier' : 'Create New Membership Tier'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-gray-300">Tier Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="e.g., Gamer, Mamba, The King"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Describe the benefits of this tier..."
                rows={3}
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price" className="text-gray-300">Monthly Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.priceUSD}
                onChange={(e) => handleInputChange('priceUSD', parseFloat(e.target.value) || 0)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="0.00"
              />
            </div>

            {/* Features */}
            <div>
              <Label htmlFor="features" className="text-gray-300">Features (comma-separated)</Label>
              <Input
                id="features"
                value={formData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="standardLeagues, premiumTournaments, profileCustomization"
              />
              <p className="text-sm text-gray-400 mt-1">
                Separate features with commas. They will be displayed as badges.
              </p>
            </div>

            {/* Buy-In Override */}
            <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold text-white">Buy-In Override</h3>
              
              {/* Exempt Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exempt"
                  checked={formData.exempt}
                  onChange={(e) => {
                    handleInputChange('exempt', e.target.checked);
                    if (e.target.checked) {
                      handleInputChange('discountPercent', 0);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="exempt" className="text-gray-300">
                  Exempt from Buy-Ins
                </Label>
              </div>
              
              {/* Discount Percent */}
              <div>
                <Label htmlFor="discountPercent" className="text-gray-300">
                  Discount Percent
                </Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                    handleInputChange('discountPercent', value);
                    if (value > 0) {
                      handleInputChange('exempt', false);
                    }
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  disabled={formData.exempt}
                />
                <p className="text-sm text-gray-400 mt-1">
                  {formData.exempt 
                    ? "Discount disabled when exempt is enabled" 
                    : "Enter percentage (0-100). If exempt is checked, this will be ignored."
                  }
                </p>
              </div>
            </div>

            {/* Stripe IDs (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stripeProductId" className="text-gray-300">Stripe Product ID</Label>
                <Input
                  id="stripeProductId"
                  value={formData.stripeProductId}
                  onChange={(e) => handleInputChange('stripeProductId', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-400"
                  placeholder="pending"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="stripePriceId" className="text-gray-300">Stripe Price ID</Label>
                <Input
                  id="stripePriceId"
                  value={formData.stripePriceId}
                  onChange={(e) => handleInputChange('stripePriceId', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-400"
                  placeholder="pending"
                  disabled
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTier ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
