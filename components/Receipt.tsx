'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface OrderItem {
  quantity: number;
  price: number;
  menu_items: {
    name: string;
  };
}

interface ReceiptProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  cashReceived?: number;
  date: string;
}

function ReceiptTemplate({
  orderNumber,
  customerName,
  items,
  totalAmount,
  paymentMethod,
  paymentReference,
  cashReceived,
  date,
}: ReceiptProps) {
  const change = cashReceived ? cashReceived - totalAmount : 0;

  return (
    <div className="w-[80mm] p-4 font-mono text-sm bg-white">
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
        <h1 className="text-2xl font-bold">SMART CAFÉ</h1>
        <p className="text-xs mt-1">Your Neighborhood Coffee Shop</p>
        <p className="text-xs">Tel: (02) 1234-5678</p>
      </div>

      {/* Order Info */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between mb-1">
          <span>Order #:</span>
          <span className="font-bold">{orderNumber}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Customer:</span>
          <span>{customerName || 'Walk-in'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(date).toLocaleString()}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t-2 border-b-2 border-dashed border-black py-2 mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1 w-12">Qty</th>
              <th className="text-right py-1 w-16">Price</th>
              <th className="text-right py-1 w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-1">{item.menu_items.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">₱{item.price.toFixed(2)}</td>
                <td className="text-right py-1">₱{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between font-bold text-base mb-2">
          <span>TOTAL:</span>
          <span>₱{totalAmount.toFixed(2)}</span>
        </div>
        
        {/* Payment Details */}
        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between mb-1">
            <span>Payment Method:</span>
            <span className="uppercase font-semibold">{paymentMethod}</span>
          </div>
          
          {paymentMethod === 'cash' && cashReceived && (
            <>
              <div className="flex justify-between mb-1">
                <span>Cash Received:</span>
                <span>₱{cashReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change:</span>
                <span>₱{change.toFixed(2)}</span>
              </div>
            </>
          )}
          
          {paymentReference && (
            <div className="flex justify-between mb-1">
              <span>Reference #:</span>
              <span className="font-mono">{paymentReference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t-2 border-dashed border-black pt-3 text-xs">
        <p className="font-bold mb-2">Thank you for your order!</p>
        <p className="mb-1">VAT Reg. TIN: 123-456-789-000</p>
        <p className="mb-1">BIR Permit #: 12345678</p>
        <p className="mb-3">THIS SERVES AS YOUR OFFICIAL RECEIPT</p>
        <p className="text-[10px]">
          Please keep this receipt for your records
        </p>
      </div>
    </div>
  );
}

export default function Receipt(props: ReceiptProps & { onClose: () => void }) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${props.orderNumber}`,
    onAfterPrint: () => {
      console.log('Receipt printed successfully');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Modal Header */}
        <div className="bg-forest text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold">Order Receipt</h2>
          <button
            onClick={props.onClose}
            className="text-white hover:text-cream text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="p-6 max-h-[70vh] overflow-auto">
          <div className="flex justify-center mb-4">
            <div className="border-2 border-gray-300 rounded-lg shadow-lg">
              <div ref={receiptRef}>
                <ReceiptTemplate {...props} />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
          <button
            onClick={props.onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-forest text-white rounded-lg hover:bg-olive transition-colors font-medium flex items-center gap-2"
          >
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
