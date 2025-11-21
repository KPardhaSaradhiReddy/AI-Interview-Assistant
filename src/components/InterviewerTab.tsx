import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Input, Select, Space, Tag, Typography, Modal, Descriptions, Popconfirm, message, Row, Col, Statistic } from 'antd';
import { SearchOutlined, EyeOutlined, UserOutlined, DeleteOutlined, TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setActiveTab } from '../store/slices/uiSlice';
import type { Candidate } from '../types';
import { deleteCandidate } from '../store/slices/candidateSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const COLORS = ['#7c5cff', '#52c41a', '#1890ff', '#faad14', '#ff4d4f', '#722ed1'];

const InterviewerTab: React.FC = () => {
  const dispatch = useDispatch();
  const candidates = useSelector((state: RootState) => state.candidates.candidates);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  React.useEffect(() => {
    dispatch(setActiveTab('interviewer'));
  }, [dispatch]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter(c => c.interviewStatus === 'completed').length;
    const inProgress = candidates.filter(c => c.interviewStatus === 'in_progress').length;
    const notStarted = candidates.filter(c => c.interviewStatus === 'not_started').length;
    
    const completedCandidates = candidates.filter(c => c.interviewStatus === 'completed' && c.finalScore !== undefined);
    const avgScore = completedCandidates.length > 0
      ? Math.round(completedCandidates.reduce((sum, c) => sum + (c.finalScore || 0), 0) / completedCandidates.length)
      : 0;
    
    const avgMCQ = completedCandidates.length > 0
      ? Math.round(completedCandidates.reduce((sum, c) => sum + (c.mcqScore || 0), 0) / completedCandidates.filter(c => c.mcqScore !== undefined).length || 1)
      : 0;
    
    const avgCoding = completedCandidates.length > 0
      ? Math.round(completedCandidates.reduce((sum, c) => sum + (c.codingScore || 0), 0) / completedCandidates.filter(c => c.codingScore !== undefined).length || 1)
      : 0;

    return { total, completed, inProgress, notStarted, avgScore, avgMCQ, avgCoding };
  }, [candidates]);

  // Score distribution data
  const scoreDistribution = useMemo(() => {
    const completed = candidates.filter(c => c.interviewStatus === 'completed' && c.finalScore !== undefined);
    const ranges = [
      { name: '90-100', count: 0, range: [90, 100] },
      { name: '80-89', count: 0, range: [80, 89] },
      { name: '70-79', count: 0, range: [70, 79] },
      { name: '60-69', count: 0, range: [60, 69] },
      { name: '0-59', count: 0, range: [0, 59] },
    ];
    
    completed.forEach(c => {
      const score = c.finalScore || 0;
      const range = ranges.find(r => score >= r.range[0] && score <= r.range[1]);
      if (range) range.count++;
    });
    
    return ranges;
  }, [candidates]);

  // Performance by category
  const categoryPerformance = useMemo(() => {
    const completed = candidates.filter(c => c.interviewStatus === 'completed');
    const data = [
      { name: 'MCQ', avgScore: 0, total: 0 },
      { name: 'Coding', avgScore: 0, total: 0 },
      { name: 'Technical', avgScore: 0, total: 0 },
    ];
    
    completed.forEach(c => {
      if (c.mcqScore !== undefined) {
        data[0].avgScore += c.mcqScore;
        data[0].total++;
      }
      if (c.codingScore !== undefined) {
        data[1].avgScore += c.codingScore;
        data[1].total++;
      }
      if (c.finalScore !== undefined && c.answers.length > 0) {
        // Estimate technical score (final - mcq - coding average)
        const technicalEst = c.finalScore - (c.mcqScore || 0) - (c.codingScore || 0);
        if (technicalEst > 0) {
          data[2].avgScore += technicalEst;
          data[2].total++;
        }
      }
    });
    
    return data.map(d => ({
      ...d,
      avgScore: d.total > 0 ? Math.round(d.avgScore / d.total) : 0
    }));
  }, [candidates]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => [
    { name: 'Completed', value: stats.completed, color: '#52c41a' },
    { name: 'In Progress', value: stats.inProgress, color: '#1890ff' },
    { name: 'Not Started', value: stats.notStarted, color: '#faad14' },
  ], [stats]);

  // Recent performance trend (last 7 days)
  const performanceTrend = useMemo(() => {
    const completed = candidates
      .filter(c => c.interviewStatus === 'completed' && c.finalScore !== undefined)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 7)
      .reverse();
    
    return completed.map((c, index) => ({
      name: `Day ${index + 1}`,
      score: c.finalScore || 0,
      mcq: c.mcqScore || 0,
      coding: c.codingScore || 0,
    }));
  }, [candidates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'default';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const filteredCandidates = candidates.filter((candidate: Candidate) => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || candidate.interviewStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (a.interviewStatus === 'completed' && b.interviewStatus !== 'completed') return -1;
    if (b.interviewStatus === 'completed' && a.interviewStatus !== 'completed') return 1;
    
    if (a.finalScore && b.finalScore) {
      return b.finalScore - a.finalScore;
    }
    
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailModalVisible(true);
  };

  const handleDelete = (candidateId: string) => {
    (dispatch as any)(deleteCandidate(candidateId));
    message.success('Candidate deleted');
    if (selectedCandidate?.id === candidateId) {
      setIsDetailModalVisible(false);
      setSelectedCandidate(null);
    }
  };

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (record: Candidate) => (
        <Space>
          <UserOutlined style={{ fontSize: '18px', color: '#7c5cff' }} />
          <div>
            <div style={{ fontWeight: 'bold', color: '#e3dfff' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'interviewStatus',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ fontSize: '12px', padding: '4px 12px' }}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Final Score',
      dataIndex: 'finalScore',
      key: 'score',
      render: (score: number) => (
        score ? (
          <Tag color={getScoreColor(score)} style={{ fontSize: '13px', fontWeight: 600 }}>
            {score}/100
          </Tag>
        ) : (
          <Tag color="default">-</Tag>
        )
      ),
    },
    {
      title: 'MCQ Score',
      key: 'mcqScore',
      render: (record: Candidate) => (
        typeof record.mcqScore === 'number' ? (
          <Tag color={getScoreColor(record.mcqScore)} style={{ fontSize: '13px' }}>
            {record.mcqScore}/100
          </Tag>
        ) : (
          <Tag color="default">-</Tag>
        )
      ),
    },
    {
      title: 'Coding Score',
      key: 'codingScore',
      render: (record: Candidate) => (
        typeof record.codingScore === 'number' ? (
          <Tag color={getScoreColor(record.codingScore)} style={{ fontSize: '13px' }}>
            {record.codingScore}/100
          </Tag>
        ) : (
          <Tag color="default">-</Tag>
        )
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record: Candidate) => (
        <div style={{ color: '#e3dfff' }}>
          {record.questions.length > 0 ? (
            `${record.currentQuestionIndex + 1}/${record.questions.length} questions`
          ) : (
            'Not started'
          )}
        </div>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: Date) => (
        <span style={{ color: '#999', fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Candidate) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{ color: '#7c5cff' }}
          >
            View
          </Button>
          <Popconfirm
            title="Delete candidate"
            description={`Are you sure you want to delete ${record.name}? This cannot be undone.`}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Enhanced Header */}
      <div style={{ 
        marginBottom: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1) 0%, rgba(0, 209, 255, 0.1) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(124, 92, 255, 0.3)'
      }}>
        <Title level={2} style={{ margin: 0, color: '#e3dfff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChartOutlined style={{ fontSize: '32px', color: '#7c5cff' }} />
          Interview Dashboard
        </Title>
        <Text style={{ color: '#999', fontSize: '14px' }}>
          Comprehensive analytics and candidate management
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15) 0%, rgba(124, 92, 255, 0.05) 100%)',
            border: '1px solid rgba(124, 92, 255, 0.3)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#e3dfff' }}>Total Candidates</span>}
              value={stats.total}
              prefix={<UserOutlined style={{ color: '#7c5cff' }} />}
              valueStyle={{ color: '#e3dfff', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.15) 0%, rgba(82, 196, 26, 0.05) 100%)',
            border: '1px solid rgba(82, 196, 26, 0.3)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#e3dfff' }}>Completed</span>}
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#e3dfff', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(24, 144, 255, 0.05) 100%)',
            border: '1px solid rgba(24, 144, 255, 0.3)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#e3dfff' }}>In Progress</span>}
              value={stats.inProgress}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#e3dfff', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(250, 173, 20, 0.15) 0%, rgba(250, 173, 20, 0.05) 100%)',
            border: '1px solid rgba(250, 173, 20, 0.3)',
            borderRadius: '12px'
          }}>
            <Statistic
              title={<span style={{ color: '#e3dfff' }}>Avg Score</span>}
              value={stats.avgScore}
              suffix="/100"
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#e3dfff', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#e3dfff', fontSize: '18px', fontWeight: 600 }}>Score Distribution</span>}
            style={{ 
              background: 'rgba(20, 25, 35, 0.6)',
              border: '1px solid rgba(124, 92, 255, 0.3)',
              borderRadius: '12px'
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(20, 25, 35, 0.95)',
                    border: '1px solid rgba(124, 92, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#e3dfff'
                  }}
                />
                <Bar dataKey="count" fill="#7c5cff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#e3dfff', fontSize: '18px', fontWeight: 600 }}>Status Distribution</span>}
            style={{ 
              background: 'rgba(20, 25, 35, 0.6)',
              border: '1px solid rgba(124, 92, 255, 0.3)',
              borderRadius: '12px'
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(20, 25, 35, 0.95)',
                    border: '1px solid rgba(124, 92, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#e3dfff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Performance Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#e3dfff', fontSize: '18px', fontWeight: 600 }}>Category Performance</span>}
            style={{ 
              background: 'rgba(20, 25, 35, 0.6)',
              border: '1px solid rgba(124, 92, 255, 0.3)',
              borderRadius: '12px'
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(20, 25, 35, 0.95)',
                    border: '1px solid rgba(124, 92, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#e3dfff'
                  }}
                />
                <Bar dataKey="avgScore" fill="#52c41a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#e3dfff', fontSize: '18px', fontWeight: 600 }}>Recent Performance Trend</span>}
            style={{ 
              background: 'rgba(20, 25, 35, 0.6)',
              border: '1px solid rgba(124, 92, 255, 0.3)',
              borderRadius: '12px'
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(20, 25, 35, 0.95)',
                    border: '1px solid rgba(124, 92, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#e3dfff'
                  }}
                />
                <Area type="monotone" dataKey="score" stackId="1" stroke="#7c5cff" fill="#7c5cff" fillOpacity={0.6} />
                <Area type="monotone" dataKey="mcq" stackId="2" stroke="#52c41a" fill="#52c41a" fillOpacity={0.6} />
                <Area type="monotone" dataKey="coding" stackId="3" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Candidates Table */}
      <Card 
        style={{ 
          background: 'rgba(20, 25, 35, 0.6)',
          border: '1px solid rgba(124, 92, 255, 0.3)',
          borderRadius: '12px'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0, color: '#e3dfff' }}>Candidates</Title>
            <Space wrap>
              <Search
                placeholder="Search candidates..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
              >
                <Option value="all">All Status</Option>
                <Option value="not_started">Not Started</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="completed">Completed</Option>
              </Select>
            </Space>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={sortedCandidates}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`,
          }}
          style={{
            background: 'transparent'
          }}
        />
      </Card>

      {/* Candidate Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserOutlined style={{ fontSize: '20px', color: '#7c5cff' }} />
            <span style={{ color: '#e3dfff' }}>Candidate Details - {selectedCandidate?.name}</span>
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={900}
        styles={{
          content: { background: 'rgba(20, 25, 35, 0.95)' },
          header: { background: 'rgba(20, 25, 35, 0.95)', borderBottom: '1px solid rgba(124, 92, 255, 0.3)' }
        }}
      >
        {selectedCandidate && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Name" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                {selectedCandidate.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                {selectedCandidate.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                {selectedCandidate.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Resume File" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                {selectedCandidate.resumeFileName || 'No file'}
              </Descriptions.Item>
              <Descriptions.Item label="Status" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                <Tag color={getStatusColor(selectedCandidate.interviewStatus)}>
                  {getStatusText(selectedCandidate.interviewStatus)}
                </Tag>
              </Descriptions.Item>
              {selectedCandidate.finalScore && (
                <Descriptions.Item label="Final Score" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                  <Tag color={getScoreColor(selectedCandidate.finalScore)}>
                    {selectedCandidate.finalScore}/100
                  </Tag>
                </Descriptions.Item>
              )}
              {typeof selectedCandidate.mcqScore === 'number' && (
                <Descriptions.Item label="MCQ Score" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                  <Tag color={getScoreColor(selectedCandidate.mcqScore)}>
                    {selectedCandidate.mcqScore}/100
                  </Tag>
                </Descriptions.Item>
              )}
              {typeof selectedCandidate.codingScore === 'number' && (
                <Descriptions.Item label="Coding Score" labelStyle={{ color: '#e3dfff' }} contentStyle={{ color: '#e3dfff' }}>
                  <Tag color={getScoreColor(selectedCandidate.codingScore)}>
                    {selectedCandidate.codingScore}/100
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedCandidate.questions.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#e3dfff' }}>Interview Questions & Answers</Title>
                {selectedCandidate.questions.map((question: any, index: number) => {
                  const answer = selectedCandidate.answers.find((a: any) => a.questionId === question.id);
                  return (
                    <Card key={question.id} style={{ marginBottom: '16px', background: 'rgba(20, 25, 35, 0.6)', border: '1px solid rgba(124, 92, 255, 0.3)' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <Tag color={question.difficulty === 'easy' ? 'green' : question.difficulty === 'medium' ? 'orange' : 'red'}>
                          {question.difficulty.toUpperCase()}
                        </Tag>
                        <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#e3dfff' }}>
                          Question {index + 1}
                        </span>
                      </div>
                      <p style={{ marginBottom: '12px', color: '#e3dfff' }}>{question.text}</p>
                      {answer ? (
                        <div>
                          <strong style={{ color: '#e3dfff' }}>Answer:</strong>
                          <p style={{ marginTop: '4px', padding: '8px', background: 'rgba(124, 92, 255, 0.1)', borderRadius: '4px', color: '#e3dfff' }}>
                            {answer.text}
                          </p>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            Time spent: {answer.timeSpent}s | Submitted: {new Date(answer.submittedAt).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#999', fontStyle: 'italic' }}>
                          No answer provided
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {selectedCandidate.aiSummary && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4} style={{ color: '#e3dfff' }}>AI Summary</Title>
                <Card style={{ background: 'rgba(20, 25, 35, 0.6)', border: '1px solid rgba(124, 92, 255, 0.3)' }}>
                  <p style={{ color: '#e3dfff' }}>{selectedCandidate.aiSummary}</p>
                </Card>
              </div>
            )}

            {selectedCandidate.mcqQuestions && selectedCandidate.mcqQuestions.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Title level={4} style={{ color: '#e3dfff' }}>MCQ Responses</Title>
                {selectedCandidate.mcqQuestions.map((question, index) => {
                  const response = selectedCandidate.mcqResponses?.find(r => r.questionId === question.id);
                  const isCorrect = response?.isCorrect;
                  return (
                    <Card key={question.id} size="small" style={{ marginBottom: '12px', background: 'rgba(20, 25, 35, 0.6)', border: '1px solid rgba(124, 92, 255, 0.3)' }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Tag color={isCorrect ? 'green' : 'red'}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Tag>
                          <Text strong style={{ color: '#e3dfff' }}>{`MCQ ${index + 1} • ${question.category.toUpperCase()}`}</Text>
                        </Space>
                        <Text style={{ color: '#e3dfff' }}>{question.question}</Text>
                        <Text type={isCorrect ? 'success' : 'danger'} style={{ color: isCorrect ? '#52c41a' : '#ff4d4f' }}>
                          Selected: {typeof response?.selectedOption === 'number'
                            ? question.options[response.selectedOption]
                            : 'Not answered'}
                        </Text>
                        <Text type="secondary" style={{ color: '#999' }}>
                          Correct: {question.options[question.correctOption]}
                        </Text>
                      </Space>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewerTab;
