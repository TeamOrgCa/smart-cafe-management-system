'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Cash', icon: '💵' },
  { value: 'gcash', label: 'GCash', icon: '📱' },
  { value: 'maya', label: 'Maya', icon: '📱' },
];

export default function UpdateOrderStatus({
  orderId,
  currentStatus,
  totalAmount,
}: {
  orderId: string;
  currentStatus: string;
  totalAmount: number;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return received - totalAmount;
  };

  const handleCompleteOrder = () => {
    setShowPaymentForm(true);
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived) || 0;
      if (!cashReceived.trim() || received <= 0) {
        alert('⚠️ Please enter the cash amount received');
        return;
      }
      if (received < totalAmount) {
        alert(
          `⚠️ Insufficient amount!\n\nReceived: ₱${received.toFixed(
            2
          )}\nRequired: ₱${totalAmount.toFixed(2)}`
        );
        return;
      }
    }

    if (
      (paymentMethod === 'gcash' || paymentMethod === 'maya') &&
      !referenceNumber.trim()
    ) {
      alert('⚠️ Please enter the reference number');
      return;
    }

    const confirmed = window.confirm(
      `Confirm payment?\n\nAmount: ₱${totalAmount.toFixed(
        2
      )}\nMethod: ${paymentMethod.toUpperCase()}`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_method: paymentMethod,
          payment_reference: referenceNumber || null,
        })
        .eq('id', orderId);

      if (error) throw error;

      setStatus('completed');
      
      // Show success message with change for cash payments
      if (paymentMethod === 'cash') {
        const received = parseFloat(cashReceived);
        const change = received - totalAmount;
        alert(
          `✅ Order completed!\n\n` +
          `Payment Method: Cash\n` +
          `Amount: ₱${totalAmount.toFixed(2)}\n` +
          `Cash Received: ₱${received.toFixed(2)}\n` +
          `Change: ₱${change.toFixed(2)}`
        );
      } else {
        alert('✅ Order completed!');
      }
      
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setShowPaymentForm(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      setStatus('cancelled');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {showPaymentForm && status === 'pending' ? (
        <div className="space-y-4 p-4 bg-beige rounded-lg border-2 border-forest">
          <h4 className="font-bold text-forest">Payment Details</h4>

          {/* Payment Method */}
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              onClick={() => setPaymentMethod(method.value)}
              className={`w-full p-3 rounded-lg ${
                paymentMethod === method.value
                  ? 'bg-forest text-white'
                  : 'bg-white'
              }`}
            >
              {method.label}
            </button>
          ))}

          {/* Cash Payment */}
          {paymentMethod === 'cash' && (
            <input
              type="number"
              placeholder="Cash received"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          )}

          {/* Online Payment Reference */}
          {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
            <input
              type="text"
              placeholder="Reference number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          )}

          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-lg"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {status === 'pending' && (
            <button
              onClick={handleCompleteOrder}
              className="w-full bg-green-500 text-white p-4 rounded-lg"
            >
              Complete Order
            </button>
          )}

          {status === 'completed' && (
            <div className="bg-green-100 p-3 text-center rounded-lg">
              ✅ Completed
            </div>
          )}

          {status === 'cancelled' && (
            <div className="bg-red-100 p-3 text-center rounded-lg">
              ❌ Cancelled
            </div>
          )}

          {status !== 'cancelled' && (
            <button
              onClick={handleCancelOrder}
              className="w-full bg-gray-100 p-3 rounded-lg"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  );
}
