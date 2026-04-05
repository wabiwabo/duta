'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Kelola profil dan informasi akunmu.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" placeholder="Nama lengkap" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" placeholder="Ceritakan tentang dirimu" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Niche Tags</Label>
            <Input id="tags" placeholder="gaming, tech, lifestyle" />
          </div>
          <Button>Simpan</Button>
        </CardContent>
      </Card>
    </div>
  );
}
