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
        <Card>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="gray.600">Total Listings</Text>
              <Text fontSize="2xl" fontWeight="bold">{formatNumber(dashboardData.totalListings)}</Text>
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

        <Card>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="gray.600">Avg Days on Market</Text>
              <Text fontSize="2xl" fontWeight="bold">{formatNumber(dashboardData.metrics.averageDaysOnMarket)} days</Text>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stack>
              <Text fontSize="sm" color="gray.600">New Listings (30d)</Text>
              <Text fontSize="2xl" fontWeight="bold">{formatNumber(dashboardData.metrics.totalNewListingsLast30Days)}</Text>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Trends</Tab>
          <Tab>Mortgage Analytics</Tab>
          <Tab>Listing Lifecycle</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
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

              <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
                <Heading size="md" mb={4}>Price Distribution</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.priceDistribution.labels,
                      datasets: [
                        {
                          label: 'Number of Listings',
                          data: dashboardData.priceDistribution.values,
                          backgroundColor: 'rgba(75, 192, 192, 0.2)',
                          borderColor: 'rgba(75, 192, 192, 1)',
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
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Listings'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Price Range'
                          }
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
              <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
                <Heading size="md" mb={4}>Daily New Listings (30 Days)</Heading>
                <Box height="300px">
                  <Line
                    data={{
                      labels: dashboardData.listingTrends.daily.dates,
                      datasets: [
                        {
                          label: 'New Listings',
                          data: dashboardData.listingTrends.daily.values,
                          borderColor: 'rgb(75, 192, 192)',
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
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Listings'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Date'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>

              <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
                <Heading size="md" mb={4}>Weekly Trends (90 Days)</Heading>
                <Box height="300px">
                  <Line
                    data={{
                      labels: dashboardData.listingTrends.weekly.dates,
                      datasets: [
                        {
                          label: 'New Listings',
                          data: dashboardData.listingTrends.weekly.values,
                          borderColor: 'rgb(153, 102, 255)',
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
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Listings'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Week'
                          }
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
              <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
                <Heading size="md" mb={4}>Mortgage Age Distribution</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.mortgageAnalytics.ageDistribution.labels,
                      datasets: [
                        {
                          label: 'Number of Mortgages',
                          data: dashboardData.mortgageAnalytics.ageDistribution.values,
                          backgroundColor: 'rgba(255, 159, 64, 0.2)',
                          borderColor: 'rgba(255, 159, 64, 1)',
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
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Mortgages'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>

              <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
                <Heading size="md" mb={4}>Balance Distribution</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.mortgageAnalytics.balanceDistribution.labels,
                      datasets: [
                        {
                          label: 'Number of Mortgages',
                          data: dashboardData.mortgageAnalytics.balanceDistribution.values,
                          backgroundColor: 'rgba(153, 102, 255, 0.2)',
                          borderColor: 'rgba(153, 102, 255, 1)',
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
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Mortgages'
                          }
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
              <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
                <Heading size="md" mb={4}>Status Distribution</Heading>
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

              <Box p={4} borderRadius="lg" boxShadow="sm" bg="white" mb={6}>
                <Heading size="md" mb={4}>Days on Market by Type</Heading>
                <Box height="300px">
                  <Bar
                    data={{
                      labels: dashboardData.listingLifecycle.daysOnMarketByType.labels,
                      datasets: [
                        {
                          label: 'Average Days on Market',
                          data: dashboardData.listingLifecycle.daysOnMarketByType.values,
                          backgroundColor: 'rgba(255, 159, 64, 0.2)',
                          borderColor: 'rgba(255, 159, 64, 1)',
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
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Days'
                          }
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