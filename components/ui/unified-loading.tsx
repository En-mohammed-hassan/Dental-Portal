"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LoadingSpinner,
  CardSkeleton,
  TableLoadingSkeleton,
} from "./loading-spinner";
import { useTranslation } from "react-i18next";

// Common animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
};

// Base page layout wrapper
interface BasePageLoadingProps {
  children: React.ReactNode;
  className?: string;
}

const BasePageLoading: React.FC<BasePageLoadingProps> = ({
  children,
  className = "",
}) => {
  const { i18n } = useTranslation();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen bg-gradient-to-br from-background to-muted ${className}`}
      dir={i18n.dir()}
    >
      <div className="container mx-auto max-w-7xl p-4 space-y-6">
        {children}
      </div>
    </motion.div>
  );
};

// Page header skeleton
const PageHeaderSkeleton: React.FC<{
  titleWidth?: string;
  subtitleWidth?: string;
  showButton?: boolean;
}> = ({ titleWidth = "w-48", subtitleWidth = "w-32", showButton = true }) => {
  const { i18n } = useTranslation();

  return (
    <motion.div
      variants={itemVariants}
      className={`flex items-center justify-between ${
        i18n.dir() === "rtl" ? "flex-row-reverse" : ""
      }`}
    >
      <div className="space-y-2">
        <Skeleton className={`h-8 ${titleWidth} bg-muted/60 rounded-md`} />
        <Skeleton className={`h-4 ${subtitleWidth} bg-muted/60 rounded-md`} />
      </div>
      {showButton && (
        <Skeleton className="h-10 w-24 bg-muted/60 rounded-full" />
      )}
    </motion.div>
  );
};

// Dashboard loading (main page)
export const DashboardLoading: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <BasePageLoading>
      {/* Header Section */}
      <PageHeaderSkeleton
        titleWidth="w-48"
        subtitleWidth="w-64"
        showButton={true}
      />

      {/* Account Balance Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 bg-[url('/images/background.svg')] bg-cover bg-center shadow-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div
                className={`flex items-center justify-between ${
                  i18n.dir() === "rtl" ? "flex-row-reverse" : ""
                }`}
              >
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-3 ${
                      i18n.dir() === "rtl" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Skeleton className="h-12 w-12 bg-[var(--primary-foreground)]/20 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24 bg-[var(--primary-foreground)]/20 rounded-md" />
                      <Skeleton className="h-5 w-32 bg-[var(--primary-foreground)]/20 rounded-md" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-9 w-9 bg-[var(--primary-foreground)]/20 rounded-md" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-[var(--primary-foreground)]/20 rounded-md" />
                <Skeleton className="h-10 w-48 bg-[var(--primary-foreground)]/20 rounded-md" />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-[var(--primary-foreground)]/20 rounded-full" />
                  <Skeleton className="h-4 w-16 bg-[var(--primary-foreground)]/20 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-[var(--primary-foreground)]/20 rounded-full" />
                  <Skeleton className="h-4 w-16 bg-[var(--primary-foreground)]/20 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <motion.div key={index} variants={itemVariants}>
            <CardSkeleton />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md bg-[var(--card)]">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-32 bg-muted/60 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-20 bg-muted/60 rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md bg-[var(--card)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Skeleton className="h-7 w-48 bg-muted/60 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-28 bg-muted/60 rounded-md" />
                <Skeleton className="h-9 w-24 bg-muted/60 rounded-md" />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
            </div>
          </CardHeader>

          <CardContent>
            <TableLoadingSkeleton rows={5} columns={4} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <Skeleton className="h-4 w-64 bg-muted/60 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-9 bg-muted/60 rounded-md" />
          ))}
          <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
        </div>
      </motion.div>
    </BasePageLoading>
  );
};

// Accounts list loading
export const AccountsListLoading: React.FC = () => (
  <BasePageLoading>
    <PageHeaderSkeleton
      titleWidth="w-48"
      subtitleWidth="w-32"
      showButton={true}
    />

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div key={index} custom={index} variants={itemVariants}>
          <CardSkeleton />
        </motion.div>
      ))}
    </div>
  </BasePageLoading>
);

// Statements list loading
export const StatementsListLoading: React.FC = () => (
  <BasePageLoading>
    <PageHeaderSkeleton
      titleWidth="w-48"
      subtitleWidth="w-32"
      showButton={true}
    />

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div key={index} custom={index} variants={itemVariants}>
          <CardSkeleton />
        </motion.div>
      ))}
    </div>
  </BasePageLoading>
);

// Transfer pages loading
export const TransferPagesLoading: React.FC = () => (
  <BasePageLoading>
    <PageHeaderSkeleton
      titleWidth="w-40"
      subtitleWidth="w-24"
      showButton={true}
    />

    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div key={index} custom={index} variants={itemVariants}>
          <CardSkeleton />
        </motion.div>
      ))}
    </div>

    <motion.div variants={itemVariants} className="flex justify-center">
      <Skeleton className="h-10 w-64 bg-muted/60 rounded-md" />
    </motion.div>
  </BasePageLoading>
);

// Simple page loading (for forms, details, etc.)
export const SimplePageLoading: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => (
  <motion.div
    variants={fadeInVariants}
    initial="hidden"
    animate="visible"
    className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted"
  >
    <LoadingSpinner size="xl" text={text} />
  </motion.div>
);

// Card grid loading
export const CardGridLoading: React.FC<{
  columns?: number;
  count?: number;
  titleWidth?: string;
  subtitleWidth?: string;
  showHeader?: boolean;
}> = ({
  columns = 3,
  count = 6,
  titleWidth = "w-48",
  subtitleWidth = "w-32",
  showHeader = true,
}) => (
  <BasePageLoading>
    {showHeader && (
      <PageHeaderSkeleton
        titleWidth={titleWidth}
        subtitleWidth={subtitleWidth}
        showButton={true}
      />
    )}

    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div key={index} custom={index} variants={itemVariants}>
          <CardSkeleton />
        </motion.div>
      ))}
    </div>
  </BasePageLoading>
);

// Table loading
export const TablePageLoading: React.FC<{
  titleWidth?: string;
  subtitleWidth?: string;
  showFilters?: boolean;
  rows?: number;
  columns?: number;
}> = ({
  titleWidth = "w-48",
  subtitleWidth = "w-32",
  showFilters = true,
  rows = 5,
  columns = 4,
}) => (
  <BasePageLoading>
    <PageHeaderSkeleton
      titleWidth={titleWidth}
      subtitleWidth={subtitleWidth}
      showButton={true}
    />

    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-md bg-[var(--card)]">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Skeleton className="h-7 w-48 bg-muted/60 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 bg-muted/60 rounded-md" />
              <Skeleton className="h-9 w-24 bg-muted/60 rounded-md" />
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
              <Skeleton className="h-10 bg-muted/60 rounded-md" />
            </div>
          )}
        </CardHeader>

        <CardContent>
          <TableLoadingSkeleton rows={rows} columns={columns} />
        </CardContent>
      </Card>
    </motion.div>

    {/* Pagination */}
    <motion.div
      variants={itemVariants}
      className="flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <Skeleton className="h-4 w-64 bg-muted/60 rounded-md" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 bg-muted/60 rounded-md" />
        ))}
        <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
      </div>
    </motion.div>
  </BasePageLoading>
);

// React Query loading wrappers for data fetching pages
export const QueryLoadingWrapper: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  loadingText?: string;
}> = ({
  isLoading,
  children,
  loadingComponent,
  loadingText = "Loading...",
}) => {
  if (isLoading) {
    return loadingComponent || <SimplePageLoading text={loadingText} />;
  }

  return <>{children}</>;
};

// Table loading wrapper - for pages with table data
export const TableQueryLoading: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  titleWidth?: string;
  subtitleWidth?: string;
  showFilters?: boolean;
  rows?: number;
  columns?: number;
}> = ({
  isLoading,
  children,
  loadingText = "Loading data...",
  titleWidth = "w-48",
  subtitleWidth = "w-32",
  showFilters = true,
  rows = 5,
  columns = 4,
}) => {
  if (isLoading) {
    return (
      <TablePageLoading
        titleWidth={titleWidth}
        subtitleWidth={subtitleWidth}
        showFilters={showFilters}
        rows={rows}
        columns={columns}
      />
    );
  }

  return <>{children}</>;
};

// Card grid loading wrapper - for pages with card data
export const CardQueryLoading: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  columns?: number;
  count?: number;
  titleWidth?: string;
  subtitleWidth?: string;
  showHeader?: boolean;
}> = ({
  isLoading,
  children,
  loadingText = "Loading data...",
  columns = 3,
  count = 6,
  titleWidth = "w-48",
  subtitleWidth = "w-32",
  showHeader = true,
}) => {
  if (isLoading) {
    return (
      <CardGridLoading
        columns={columns}
        count={count}
        titleWidth={titleWidth}
        subtitleWidth={subtitleWidth}
        showHeader={showHeader}
      />
    );
  }

  return <>{children}</>;
};

// Dashboard loading wrapper - for main dashboard pages
export const DashboardQueryLoading: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}> = ({ isLoading, children, loadingText = "Loading dashboard..." }) => {
  if (isLoading) {
    return <DashboardLoading />;
  }

  return <>{children}</>;
};

// Transfer pages loading wrapper
export const TransferQueryLoading: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}> = ({ isLoading, children, loadingText = "Loading transfer..." }) => {
  if (isLoading) {
    return <TransferPagesLoading />;
  }

  return <>{children}</>;
};

// Cards list loading
export const CardsListLoading: React.FC = () => (
  <BasePageLoading>
    <PageHeaderSkeleton
      titleWidth="w-48"
      subtitleWidth="w-32"
      showButton={true}
    />

    {/* Filters Card */}
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-md bg-[var(--card)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 bg-muted/60 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 bg-muted/60 rounded-md" />
              <Skeleton className="h-9 w-24 bg-muted/60 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-10 bg-muted/60 rounded-md" />
            <Skeleton className="h-10 bg-muted/60 rounded-md" />
            <Skeleton className="h-10 bg-muted/60 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </motion.div>

    {/* Cards Table */}
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-md bg-[var(--card)]">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-7 w-48 bg-muted/60 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-64 bg-muted/60 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TableLoadingSkeleton rows={8} columns={8} />
        </CardContent>
      </Card>
    </motion.div>

    {/* Pagination */}
    <motion.div
      variants={itemVariants}
      className="flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <Skeleton className="h-4 w-64 bg-muted/60 rounded-md" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 bg-muted/60 rounded-md" />
        ))}
        <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
      </div>
    </motion.div>
  </BasePageLoading>
);

// ATMs list loading
export const ATMsListLoading: React.FC = () => (
  <BasePageLoading>
    <PageHeaderSkeleton
      titleWidth="w-48"
      subtitleWidth="w-32"
      showButton={true}
    />

    {/* View Mode and Filters Card */}
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-md bg-[var(--card)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 bg-muted/60 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 bg-muted/60 rounded-md" />
              <Skeleton className="h-9 w-20 bg-muted/60 rounded-md" />
              <Skeleton className="h-9 w-20 bg-muted/60 rounded-md" />
              <Skeleton className="h-9 w-24 bg-muted/60 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-10 bg-muted/60 rounded-md" />
            <Skeleton className="h-10 bg-muted/60 rounded-md" />
            <Skeleton className="h-10 bg-muted/60 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </motion.div>

    {/* ATMs Table */}
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-md bg-[var(--card)]">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-7 w-48 bg-muted/60 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-64 bg-muted/60 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TableLoadingSkeleton rows={8} columns={6} />
        </CardContent>
      </Card>
    </motion.div>

    {/* Pagination */}
    <motion.div
      variants={itemVariants}
      className="flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <Skeleton className="h-4 w-64 bg-muted/60 rounded-md" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 bg-muted/60 rounded-md" />
        ))}
        <Skeleton className="h-9 w-9 bg-muted/60 rounded-md" />
      </div>
    </motion.div>
  </BasePageLoading>
);
