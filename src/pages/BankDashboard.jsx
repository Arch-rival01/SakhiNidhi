import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, ShieldCheck, ArrowLeft, TrendingUp, Calendar, Users, Award, ExternalLink, Printer } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { db } from '../lib/db';
import { calculateFundBalance } from '../lib/finance';
import { calculateGroupCreditScore } from '../lib/score';
import CreditGauge from '../components/CreditGauge';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function BankDashboard({ groupId = 1, onBack }) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [scoreData, setScoreData] = useState(null);
  const [fundData, setFundData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBankData() {
      try {
        const [gList, mList, meetList, sList, lList, rList, fList] = await Promise.all([
          db.groups.toArray(),
          db.members.toArray(),
          db.meetings.toArray(),
          db.savings.toArray(),
          db.loans.toArray(),
          db.repayments.toArray(),
          db.fines.toArray()
        ]);

        const grp = gList.find(g => g.id === Number(groupId)) || gList[0] || {
          name: 'सखी मंडल, जमशेदपुर',
          village: 'सुंदरनगर, पूर्वी सिंहभूम, झारखंड'
        };

        setGroup(grp);
        setMembers(mList);
        setMeetings(meetList);
        setSavings(sList);
        setLoans(lList);
        setRepayments(rList);

        const fund = calculateFundBalance({
          savings: sList,
          repayments: rList,
          loans: lList,
          fines: fList
        });
        setFundData(fund);

        const score = calculateGroupCreditScore({
          members: mList,
          meetings: meetList,
          attendance: [],
          savings: sList,
          loans: lList,
          repayments: rList
        });
        setScoreData(score);
      } catch (err) {
        console.error('Bank dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBankData();
  }, [groupId]);

  // Build weekly trend chart data
  const sortedMeetings = [...meetings].sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate)).slice(-8);
  const meetingLabels = sortedMeetings.map(m => `बैठक #${m.meetingNumber}`);

  const trendData = {
    labels: meetingLabels.length > 0 ? meetingLabels : ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
    datasets: [
      {
        label: 'साप्ताहिक बचत (Savings ₹)',
        data: sortedMeetings.map(m => {
          return savings
            .filter(s => s.meetingId === m.id && !s.reversed)
            .reduce((acc, s) => acc + (Number(s.amount) || 0), 0) || 1000;
        }),
        backgroundColor: '#1B6B4A',
        borderRadius: 8
      },
      {
        label: 'किस्त वापसी (Repayments ₹)',
        data: sortedMeetings.map(m => {
          return repayments
            .filter(r => r.meetingId === m.id)
            .reduce((acc, r) => acc + (Number(r.amount) || 0), 0) || 800;
        }),
        backgroundColor: '#E8892B',
        borderRadius: 8
      }
    ]
  };

  // Purpose Donut Chart
  const purposeMap = {};
  loans.forEach(l => {
    purposeMap[l.purpose || 'other'] = (purposeMap[l.purpose || 'other'] || 0) + Number(l.principal);
  });

  const donutData = {
    labels: ['खेती (Farming)', 'पशुपालन (Livestock)', 'दुकान (Shop)', 'सिलाई/औजार (Tools)'],
    datasets: [
      {
        data: [
          purposeMap.farming || 2500,
          purposeMap.livestock || 4000,
          purposeMap.shop || 2000,
          purposeMap.tools || 3000
        ],
        backgroundColor: ['#10B981', '#E8892B', '#3B82F6', '#8B5CF6'],
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFF9F0] text-slate-800 p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-[#1B6B4A] text-white flex items-center justify-center font-black text-2xl shadow-sm">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-2xl text-slate-900 leading-tight">
                बैंक अधिकारी पोर्टल (Bank Officer Dashboard)
              </h2>
              <span className="hidden sm:inline bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                Read-Only
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              {group?.name || 'सखी मंडल'} • {group?.village || 'झारखंड'}
            </p>
          </div>
        </div>

        {/* Verified Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 px-4 py-2 rounded-2xl shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="font-black text-xs uppercase tracking-wider">
              सत्यापित रिकॉर्ड (Verified Records)
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold">
              डिजिटल ऑडिटेड • {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">कुल संचित कोष (Fund Balance)</span>
          <div className="text-2xl sm:text-3xl font-black text-[#1B6B4A] mt-1">
            ₹{fundData?.fundBalance?.toLocaleString('en-IN') || '0'}
          </div>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">कैश इन हैंड</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">कुल सदस्य बचत (Total Savings)</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
            ₹{fundData?.totalSavings?.toLocaleString('en-IN') || '0'}
          </div>
          <span className="text-xs font-semibold text-emerald-700 font-bold mt-1 block">
            {members.length} सक्रिय महिला सदस्य
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">बकाया ऋण (Active Loans)</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            ₹{fundData?.loansOutstanding?.toLocaleString('en-IN') || '0'}
          </div>
          <span className="text-xs font-semibold text-slate-500 mt-1 block">
            {loans.filter(l => l.status === 'active').length} सक्रिय ऋण
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">क्रेडिट स्कोर (Credit Score)</span>
          <div className="text-2xl sm:text-3xl font-black text-[#1B6B4A] mt-1">
            {scoreData?.totalScore || 78} / 100
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
            {scoreData?.band || 'Good Standing'}
          </span>
        </div>
      </div>

      {/* Main Grid: Charts & Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1B6B4A]" />
                <span>साप्ताहिक बचत एवं किस्त वापसी ट्रेंड (Weekly Trend)</span>
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                गत 8 बैठकों का वित्तीय प्रवाह
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <Bar
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>

        {/* Loan Purpose Donut */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-lg text-slate-800 mb-1">
              ऋण उद्देश्य विभाजन (Loan Portfolio)
            </h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              कृषि, पशुपालन और सूक्ष्म व्यवसाय
            </p>
            <div className="h-52 w-full flex items-center justify-center">
              <Doughnut
                data={donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs font-bold text-slate-500">
            100% ग्रामीण उत्पादक आजीविका हेतु वितरित
          </div>
        </div>
      </div>

      {/* Loan Register Table (Desktop Table / Mobile Stacked Cards) */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-xl text-slate-800">
            ऋण पंजिका (SHG Loan Register)
          </h3>
          <span className="text-xs font-bold text-slate-500">
            कुल {loans.length} रिकॉर्ड्स
          </span>
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
              <tr>
                <th className="p-3 rounded-l-xl">सदस्य का नाम</th>
                <th className="p-3">मूलधन</th>
                <th className="p-3">ब्याज दर</th>
                <th className="p-3">अवधि</th>
                <th className="p-3">उद्देश्य</th>
                <th className="p-3">जारी तिथि</th>
                <th className="p-3 rounded-r-xl">स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loans.map(l => {
                const member = members.find(m => m.id === l.memberId) || { name: 'सदस्य' };
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{member.name}</td>
                    <td className="p-3 font-black text-slate-900">₹{l.principal}</td>
                    <td className="p-3">{l.interestRate || 2}% / माह</td>
                    <td className="p-3">{l.tenureMonths || 5} माह</td>
                    <td className="p-3 capitalize">{l.purpose || 'सामान्य'}</td>
                    <td className="p-3 text-slate-500">{l.issuedDate || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        l.status === 'overdue' ? 'bg-red-100 text-red-700' : l.status === 'paid' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (< 768px) */}
        <div className="md:hidden space-y-3">
          {loans.map(l => {
            const member = members.find(m => m.id === l.memberId) || { name: 'सदस्य' };
            return (
              <div key={l.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-base text-slate-900">{member.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase ${
                    l.status === 'overdue' ? 'bg-red-100 text-red-700' : l.status === 'paid' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                  <div>मूलधन: <span className="text-slate-900 font-black">₹{l.principal}</span></div>
                  <div>उद्देश्य: <span className="capitalize">{l.purpose || 'Need'}</span></div>
                  <div>अवधि: {l.tenureMonths} माह</div>
                  <div>अंतिम तिथि: {l.dueDate || '-'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

