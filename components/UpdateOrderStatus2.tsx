'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Receipt = dynamic(() => import('./Receipt'), { ssr: false });

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Cash', icon: '💵' },
  { value: 'gcash', label: 'GCash', icon: '📱' },
  { value: 'maya', label: 'Maya', icon: '📱' },
];

export default function UpdateOrderStatus({
  orderId,
  currentStatus,
  totalAmount,
  orderNumber,
  customerName,
  orderItems,
  orderDate,
}: {
  orderId: string;
  currentStatus: string;
  totalAmount: number;
  orderNumber: string;
  customerName: string;
  orderItems: any[];
  orderDate: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Get current user role
  useEffect(() => {
    async function fetchUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    }
    fetchUserRole();
  }, []);

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
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_method: paymentMethod,
          payment_reference: referenceNumber || null,
          processed_by_id: user?.id || null, // Track who processed the order
        })
        .eq('id', orderId);

      if (error) throw error;

      setStatus('completed');
      setShowPaymentForm(false);
      setShowReceipt(true);
      
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    // If user is staff, require admin PIN
    if (userRole === 'staff') {
      setShowPinModal(true);
      return;
    }

    // If admin, proceed with normal confirmation
    const confirmed = window.confirm(
      '❌ VOID/CANCEL THIS ORDER?\n\n' +
      'This action cannot be undone.\n\n' +
      'Are you sure you want to cancel this order?'
    );
    
    if (!confirmed) return;

    await performCancellation();
  };

  const verifyAdminPin = async (pinToVerify?: string) => {
    const pinValue = pinToVerify || adminPin;
    
    if (!pinValue.trim()) {
      setPinError('Please enter admin PIN');
      return;
    }

    setPinError('');
    setLoading(true);

    try {
      // Verify PIN against admin users
      const { data: admins, error } = await supabase
        .from('users')
        .select('id, pin')
        .eq('role', 'admin');

      if (error) throw error;

      // Check if entered PIN matches any admin
      const isValidPin = admins?.some(admin => admin.pin === pinValue);

      if (!isValidPin) {
        setPinError('Invalid admin PIN. Please try again.');
        setAdminPin('');
        setLoading(false);
        return;
      }

      // PIN is valid, close modal and proceed with cancellation
      setShowPinModal(false);
      setAdminPin('');
      setPinError('');

      const confirmed = window.confirm(
        '❌ VOID/CANCEL THIS ORDER?\n\n' +
        'Admin PIN verified.\n\n' +
        'This action cannot be undone. Continue?'
      );
      
      if (!confirmed) {
        setLoading(false);
        return;
      }

      await performCancellation();
    } catch (err: any) {
      setPinError('Error verifying PIN. Please try again.');
      setAdminPin('');
      setLoading(false);
    }
  };

  const performCancellation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      setStatus('cancelled');
      router.refresh();
    } catch (err: any) {
      alert('Error cancelling order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {showPaymentForm && status === 'pending' ? (
          <div className="space-y-4 p-4 bg-beige rounded-lg border-2 border-forest">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-forest">Payment Details</h4>
              <button 
                onClick={() => setShowPaymentForm(false)}
                className="text-olive hover:text-forest"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-forest mb-2">
                Select Payment Method:
              </label>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all text-left flex items-center gap-3 ${
                      paymentMethod === method.value
                        ? 'bg-forest text-white ring-2 ring-olive'
                        : 'bg-white text-forest hover:bg-cream'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span>{method.label}</span>
                    {paymentMethod === method.value && <span className="ml-auto">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number for Online Payments */}
            {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
              <div>
                <label className="block text-sm font-medium text-forest mb-2">
                  Reference Number: <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Enter transaction reference number"
                  className="w-full px-4 py-3 border-2 border-olive/30 rounded-lg focus:outline-none focus:border-forest"
                  required
                />
                <p className="text-xs text-olive mt-1">
                  Please verify the reference number before confirming
                </p>
              </div>
            )}

            {/* Cash Amount for Cash Payments */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-forest mb-2">
                    Cash Received: <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-forest font-medium">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border-2 border-olive/30 rounded-lg focus:outline-none focus:border-forest text-lg"
                      required
                    />
                  </div>
                </div>

                {/* Amount Summary */}
                <div className="bg-white p-4 rounded-lg border-2 border-olive/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-olive">Total Amount:</span>
                    <span className="font-semibold text-forest">₱{totalAmount.toFixed(2)}</span>
                  </div>
                  {cashReceived && parseFloat(cashReceived) > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-olive">Cash Received:</span>
                        <span className="font-semibold text-forest">₱{parseFloat(cashReceived).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-olive/20 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-bold text-forest">Change:</span>
                          <span className={`text-xl font-bold ${calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₱{calculateChange().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {cashReceived && parseFloat(cashReceived) < totalAmount && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    ⚠️ Insufficient amount! Need ₱{(totalAmount - parseFloat(cashReceived)).toFixed(2)} more
                  </div>
                )}
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-bold transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Processing...' : '✅ CONFIRM PAYMENT RECEIVED'}
            </button>
          </div>
        ) : (
          /* Status Buttons */
          <div className="space-y-3">
            {/* Complete Order Button - Only show if pending */}
            {status === 'pending' && (
              <button
                onClick={handleCompleteOrder}
                disabled={loading}
                className="w-full bg-green-500 text-white px-4 py-4 rounded-lg hover:bg-green-600 shadow-lg font-bold transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">✅</span>
                  <span>COMPLETE ORDER (Process Payment)</span>
                </div>
              </button>
            )}

            {/* Current Status Display */}
            {status === 'completed' && (
              <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg font-semibold text-center ring-2 ring-green-600">
                ✅ Order Completed
              </div>
            )}

            {status === 'cancelled' && (
              <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg font-semibold text-center ring-2 ring-red-600">
                ❌ Order Cancelled
              </div>
            )}

            {/* Cancel Button - Only show if not already cancelled */}
            {status !== 'cancelled' && (
              <button
                onClick={handleCancelOrder}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-700 font-medium transition-all disabled:opacity-50"
              >
                ❌ Void/Cancel Order
              </button>
            )}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <Receipt
          orderNumber={orderNumber}
          customerName={customerName}
          items={orderItems}
          totalAmount={totalAmount}
          paymentMethod={paymentMethod}
          paymentReference={referenceNumber || undefined}
          cashReceived={paymentMethod === 'cash' ? parseFloat(cashReceived) : undefined}
          date={orderDate}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Admin PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">🔒 Admin Authorization Required</h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-6 text-center">
                Enter admin PIN to authorize order cancellation
              </p>

              {pinError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-center text-sm">
                  ⚠️ {pinError}
                </div>
              )}

              {/* PIN Circles Display */}
              <div className="mb-6">
                <div className="flex justify-center gap-4 mb-6">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        adminPin.length > index
                          ? 'bg-red-600 border-red-600'
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Hidden Input */}
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={adminPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setAdminPin(value);
                    setPinError('');
                    // Auto-verify when 4 digits entered
                    if (value.length === 4) {
                      setTimeout(() => verifyAdminPin(value), 300);
                    }
                  }}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-center text-2xl tracking-[1em] opacity-0 h-0 absolute"
                  autoFocus
                />

                {/* Clickable area to focus input */}
                <div
                  onClick={() => {
                    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                    input?.focus();
                  }}
                  className="text-center text-sm text-gray-500 cursor-pointer hover:text-gray-700"
                >
                  {adminPin.length === 0 ? 'Tap to enter PIN' : `${adminPin.length}/4`}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setAdminPin('');
                  setPinError('');
                }}
                disabled={loading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyAdminPin()}
                disabled={loading || adminPin.length !== 4}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
