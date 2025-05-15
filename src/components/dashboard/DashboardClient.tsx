'use client';

import React from 'react';
import { Box, Heading, Text, SimpleGrid, Card, CardBody, Stack, Alert, AlertIcon, Spinner } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { DashboardService } from '@/services/dashboard.service';
import { DashboardResponse } from '@/types/dashboard';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
);

const dashboardService = new DashboardService();

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function DashboardClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => dashboardService.fetchDashboardData(),
    retry: 1,
  });

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          Error loading dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={4}>
        <Alert status="warning">
          <AlertIcon />
          No data available.
        </Alert>
      </Box>
    );
  }

  const dashboardData = data.data;

  return (
    <Box p={4}>
      <Heading mb={6}>Listings Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="gray.600">Total Listings</Text>
              <Text fontSize="2xl" fontWeight="bold">{dashboardData.totalListings}</Text>
            </Stack>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="gray.600">Average Price</Text>
              <Text fontSize="2xl" fontWeight="bold">{formatCurrency(dashboardData.metrics.averagePrice)}</Text>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
        <Heading size="md" mb={4}>Assumable Loan Distribution</Heading>
        <Box height="300px">
          <Pie
            data={{
              labels: dashboardData.assumableListings.labels,
              datasets: [
                {
                  data: dashboardData.assumableListings.values,
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                  ],
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
} 