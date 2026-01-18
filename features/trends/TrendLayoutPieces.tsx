"use client";

import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";

export const TrendsSignInGate = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <div className="bg-muted p-4 rounded-full">
      <User className="w-8 h-8 text-muted-foreground" />
    </div>
    <h2 className="text-xl font-semibold">Please Sign In</h2>
    <p className="text-muted-foreground max-w-sm text-center">
      Sign in to view trends across your lab reports.
    </p>
    <Button asChild>
      <a href="/auth">Go to Sign In</a>
    </Button>
  </div>
);

export const TrendsLoadingState = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <LoadingState />
  </div>
);

export const TrendsErrorState = ({ error }: { error: string }) => (
  <Card className="max-w-2xl">
    <CardHeader>
      <CardTitle>Trends</CardTitle>
      <CardDescription>{error}</CardDescription>
    </CardHeader>
  </Card>
);

export const TrendsEmptyState = () => (
  <Card>
    <CardHeader>
      <CardTitle>Trends</CardTitle>
      <CardDescription>No finalized results yet.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Upload a report and confirm results to see trends here.
      </p>
    </CardContent>
  </Card>
);
