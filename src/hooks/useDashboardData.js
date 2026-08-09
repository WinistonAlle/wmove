import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboardData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const startOfMonth     = new Date(now.getFullYear(), now.getMonth(),     1).toISOString()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

      const [
        { data: vehicles },
        { data: rentals },
        { data: payments },
        { data: lastMonthPayments },
        { data: maintenances },
      ] = await Promise.all([
        supabase.from('vehicles').select('id, plate, brand, model, year, mileage, status').order('updated_at', { ascending: false }),
        supabase
          .from('rentals')
          .select('id, status, start_date, expected_end, end_date, created_at, total_amount, daily_rate, customers(name), vehicles(plate)')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', startOfMonth),
        supabase.from('payments').select('amount').eq('status', 'paid').gte('paid_at', startOfLastMonth).lt('paid_at', startOfMonth),
        supabase.from('maintenances').select('type').eq('completed', false),
      ])

      const allVehicles     = vehicles || []
      const totalVehicles   = allVehicles.length
      const rentedCount     = allVehicles.filter(v => v.status === 'rented').length
      const maintenanceCount= allVehicles.filter(v => v.status === 'maintenance').length
      const availableCount  = allVehicles.filter(v => v.status === 'available').length

      const monthRevenue  = (payments          || []).reduce((s, p) => s + Number(p.amount), 0)
      const lastRevenue   = (lastMonthPayments  || []).reduce((s, p) => s + Number(p.amount), 0)
      const revenueGrowth = lastRevenue > 0
        ? Math.round(((monthRevenue - lastRevenue) / lastRevenue) * 100)
        : null

      const urgentCount  = (maintenances || []).filter(m => m.type === 'corrective').length
      const totalPending = (maintenances || []).length

      setData({
        metrics: { totalVehicles, rentedCount, maintenanceCount, availableCount, monthRevenue, revenueGrowth, urgentCount, totalPending },
        vehicles: allVehicles,
        rentals:  rentals || [],
      })
      setLoading(false)
    }

    load()
  }, [])

  return { data, loading }
}
