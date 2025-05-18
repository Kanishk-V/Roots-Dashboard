'use client';

import React from 'react';
import { Box, Heading, Text, SimpleGrid, Card, CardBody, Stack, Alert, AlertIcon, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { DashboardService } from '@/services/dashboard.service';
import { DashboardResponse } from '@/types/dashboard';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Pie chart color palette
const PIE_GREENS = [
  '#D1FF4C', // bright lime
  '#A3E635', // vivid green
  '#65C466', // medium green
  '#3CA86B', // darker green
  '#1B5E20', // deep green
];

// Pie chart color palette for Assumable Loan Distribution
const ASSUMABLE_PIE_COLORS = [
  '#D1FF4C', // primary green
  '#e6ffb3',    // light green as secondary
  '#A3E635', // vivid green
  '#65C466', // medium green
  '#3CA86B', // darker green
  '#1B5E20', // deep green
];

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
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Card bg="#D1FF4C" border="3px solid #000" borderRadius="18px" boxShadow="none" p={6}>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="#000" fontWeight="bold">Total Listings</Text>
              <Text fontSize="3xl" fontWeight="extrabold" color="#000">
                {formatNumber(dashboardData.totalListings)}
              </Text>
            </Stack>
          </CardBody>
        </Card>
        
        <Card bg="#fff" border="3px solid #000" borderRadius="18px" boxShadow="none" p={6}>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="#000" fontWeight="bold">Average Price</Text>
              <Text fontSize="3xl" fontWeight="extrabold" color="#000">
                {formatCurrency(dashboardData.metrics.averagePrice)}
              </Text>
            </Stack>
          </CardBody>
        </Card>

        <Card bg="#D1FF4C" border="3px solid #000" borderRadius="18px" boxShadow="none" p={6}>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="#000" fontWeight="bold">Avg Days on Market</Text>
              <Text fontSize="3xl" fontWeight="extrabold" color="#000">
                {formatNumber(dashboardData.metrics.averageDaysOnMarket)} days
              </Text>
            </Stack>
          </CardBody>
        </Card>

        <Card bg="#fff" border="3px solid #000" borderRadius="18px" boxShadow="none" p={6}>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="#000" fontWeight="bold">New Listings (30d)</Text>
              <Text fontSize="3xl" fontWeight="extrabold" color="#000">
                {formatNumber(dashboardData.metrics.totalNewListingsLast30Days)}
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs variant="unstyled">
        <TabList mb={4}>
          <Tab _selected={{ bg: '#D1FF4C', color: '#000', border: '3px solid #000', borderRadius: '12px' }} fontWeight="bold" fontSize="lg">Overview</Tab>
          <Tab _selected={{ bg: '#D1FF4C', color: '#000', border: '3px solid #000', borderRadius: '12px' }} fontWeight="bold" fontSize="lg">Trends</Tab>
          <Tab _selected={{ bg: '#D1FF4C', color: '#000', border: '3px solid #000', borderRadius: '12px' }} fontWeight="bold" fontSize="lg">Mortgage Analytics</Tab>
          <Tab _selected={{ bg: '#D1FF4C', color: '#000', border: '3px solid #000', borderRadius: '12px' }} fontWeight="bold" fontSize="lg">Listing Lifecycle</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Assumable Loan Distribution</Heading>
                <Box height="300px">
                  <Pie
                    data={{
                      labels: dashboardData.assumableListings.labels,
                      datasets: [
                        {
                          data: dashboardData.assumableListings.values,
                          backgroundColor: ASSUMABLE_PIE_COLORS.slice(0, dashboardData.assumableListings.labels.length),
                          borderColor: '#000',
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Price Distribution</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.priceDistribution.labels,
                      datasets: [
                        {
                          label: 'Number of Listings',
                          data: dashboardData.priceDistribution.values,
                          backgroundColor: '#D1FF4C',
                          borderColor: '#000',
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Listings',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Price Range',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </SimpleGrid>
          </TabPanel>

          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Monthly New Listings (12 Months)</Heading>
                <Box height="300px">
                  <Line
                    data={{
                      labels: dashboardData.listingTrends.monthly.dates,
                      datasets: [
                        {
                          label: 'New Listings',
                          data: dashboardData.listingTrends.monthly.values,
                          borderColor: '#000',
                          backgroundColor: '#D1FF4C',
                          borderWidth: 3,
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Listings',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Month',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>

              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Weekly Trends (90 Days)</Heading>
                <Box height="300px">
                  <Line
                    data={{
                      labels: dashboardData.listingTrends.weekly.dates,
                      datasets: [
                        {
                          label: 'New Listings',
                          data: dashboardData.listingTrends.weekly.values,
                          borderColor: '#000',
                          backgroundColor: '#D1FF4C',
                          borderWidth: 3,
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Listings',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Week',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </SimpleGrid>
          </TabPanel>

          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Mortgage Age Distribution</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.mortgageAnalytics.ageDistribution.labels,
                      datasets: [
                        {
                          label: 'Number of Mortgages',
                          data: dashboardData.mortgageAnalytics.ageDistribution.values,
                          backgroundColor: '#D1FF4C',
                          borderColor: '#000',
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Mortgages',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>

              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Balance Distribution</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.mortgageAnalytics.balanceDistribution.labels,
                      datasets: [
                        {
                          label: 'Number of Mortgages',
                          data: dashboardData.mortgageAnalytics.balanceDistribution.values,
                          backgroundColor: '#D1FF4C',
                          borderColor: '#000',
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Mortgages',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </SimpleGrid>
          </TabPanel>

          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Status Distribution</Heading>
                <Box height="300px">
                  <Pie
                    data={{
                      labels: dashboardData.listingLifecycle.statusDistribution.labels,
                      datasets: [
                        {
                          data: dashboardData.listingLifecycle.statusDistribution.values,
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                          ],
                          borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                          ],
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box p={4} borderRadius="18px" border="3px solid #000" boxShadow="none" bg="#fff" mb={6}>
                <Heading size="md" mb={4} color="#000" fontWeight="extrabold">Days on Market by Type</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.listingLifecycle.daysOnMarketByType.labels,
                      datasets: [
                        {
                          label: 'Average Days on Market',
                          data: dashboardData.listingLifecycle.daysOnMarketByType.values,
                          backgroundColor: '#D1FF4C',
                          borderColor: '#000',
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                          labels: { color: '#000', font: { weight: 'bold', size: 16 } }
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Days',
                            color: '#000',
                            font: { weight: 'bold', size: 16 }
                          },
                          ticks: { color: '#000', font: { weight: 'bold' } }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 